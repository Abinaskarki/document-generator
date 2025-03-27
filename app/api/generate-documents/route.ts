import { type NextRequest, NextResponse } from "next/server";
import { parseCSV, processTemplate } from "@/lib/document-processor";
import { v4 as uuidv4 } from "uuid";
import { collection, addDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db } from "@/lib/firebase";
import puppeteer from "puppeteer";
import { PDFDocument } from "pdf-lib";

const storage = getStorage();

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const templateHtml = formData.get("templateHtml") as File;
    const csvFile = formData.get("csv") as File;

    // Validate required files
    if (!templateHtml || !csvFile) {
      return NextResponse.json(
        {
          error: "Both template HTML and CSV files are required",
          details: "Please upload a template HTML file and a CSV file",
        },
        { status: 400 }
      );
    }

    // Generate a unique batch ID
    const batchId = `custom-${uuidv4()}`;

    // Upload the original template HTML to Firebase Storage
    const templateBuffer = await templateHtml.arrayBuffer();
    const templateRef = ref(
      storage,
      `templates/${batchId}/${templateHtml.name}`
    );
    await uploadBytes(templateRef, new Uint8Array(templateBuffer));
    const templateUrl = await getDownloadURL(templateRef);

    // Upload the original CSV file to Firebase Storage
    const csvBuffer = await csvFile.arrayBuffer();
    const csvRef = ref(storage, `csv/${batchId}/${csvFile.name}`);
    await uploadBytes(csvRef, new Uint8Array(csvBuffer));
    const csvUrl = await getDownloadURL(csvRef);

    // Parse the CSV file
    const csvContent = new TextDecoder().decode(csvBuffer);
    const csvData = await parseCSV(csvContent);

    if (!csvData || csvData.length === 0) {
      return NextResponse.json(
        {
          error: "CSV file is empty or invalid",
          details:
            "Your CSV file must contain at least one row of data with headers",
        },
        { status: 400 }
      );
    }

    // Generate documents and merge them into a single PDF
    const pdfPages: Uint8Array[] = [];
    const templateHtmlContent = new TextDecoder().decode(templateBuffer);

    for (const row of csvData) {
      // Replace placeholders in the HTML content
      const processedHtml = processTemplate(templateHtmlContent, row);

      // Add custom CSS for paragraph spacing
      const htmlWithStyles = `
        <style>
          p { margin-bottom: 1em; }
        </style>
        ${processedHtml}
      `;

      // Convert the processed HTML to PDF using Puppeteer
      const pdfPage = await convertHtmlToPdf(htmlWithStyles);
      pdfPages.push(pdfPage);
    }

    // Create a single PDF from all pages
    const pdfBuffer = await createPDF(
      pdfPages.map((page) => page.slice().buffer)
    );

    // Upload the generated PDF to Firebase Storage
    const pdfRef = ref(storage, `pdf/${batchId}/generated-document.pdf`);
    await uploadBytes(pdfRef, pdfBuffer);
    const pdfUrl = await getDownloadURL(pdfRef);

    // Store batch metadata in Firestore
    await addDoc(collection(db, "batches"), {
      id: batchId,
      templateUrl,
      csvUrl,
      pdfUrl,
      documentCount: csvData.length,
      csvHeaders: Object.keys(csvData[0]),
    });

    return NextResponse.json({
      batchId,
      documentCount: csvData.length,
      csvHeaders: Object.keys(csvData[0]),
      pdfUrl,
      success: true,
    });
  } catch (error) {
    console.error("Error processing files:", error);
    return NextResponse.json(
      {
        error: "Failed to process files",
        details:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}

// Helper function to convert HTML to PDF using Puppeteer
async function convertHtmlToPdf(htmlContent: string): Promise<Uint8Array> {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(htmlContent);
  const pdfBuffer = await page.pdf({ format: "A4" });
  await browser.close();
  return pdfBuffer;
}

// Helper function to merge multiple PDF pages into a single PDF
async function createPDF(pages: ArrayBuffer[]): Promise<Uint8Array> {
  try {
    const mergedPdf = await PDFDocument.create();

    for (const pageBuffer of pages) {
      const pdf = await PDFDocument.load(pageBuffer);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    const mergedPdfBytes = await mergedPdf.save();
    return new Uint8Array(mergedPdfBytes);
  } catch (error) {
    console.error("Error merging PDF pages:", error);
    throw new Error("Failed to merge PDF pages");
  }
}
