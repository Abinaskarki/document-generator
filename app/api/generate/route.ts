import { type NextRequest, NextResponse } from "next/server";
import {
  parseCSV,
  processTemplate,
  processDocxTemplate,
} from "@/lib/document-processor";
import { v4 as uuidv4 } from "uuid";
import { collection, addDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db } from "@/lib/firebase";
import puppeteer from "puppeteer"; // For HTML to PDF conversion

const storage = getStorage();

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const templateFile = formData.get("template") as File;
    const csvFile = formData.get("csv") as File;

    // Validate required files
    if (!templateFile || !csvFile) {
      return NextResponse.json(
        {
          error: "Both template and CSV files are required",
          details: "Please upload a template file and a CSV file",
        },
        { status: 400 }
      );
    }

    // Generate a unique batch ID
    const batchId = `custom-${uuidv4()}`;

    // Upload the original template to Firebase Storage
    const templateBuffer = await templateFile.arrayBuffer();
    const templateRef = ref(
      storage,
      `templates/${batchId}/${templateFile.name}`
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
    for (const row of csvData) {
      if (
        templateFile.name.endsWith(".docx") ||
        templateFile.name.endsWith(".doc")
      ) {
        // Use the processDocxTemplate utility function
        const htmlWithStyles = await processDocxTemplate(templateBuffer, row);

        // Convert the processed HTML to PDF using Puppeteer
        const pdfPage = await convertHtmlToPdf(htmlWithStyles);
        pdfPages.push(pdfPage);
      } else {
        // Process HTML template and convert to PDF
        const templateContent = new TextDecoder().decode(templateBuffer);
        const documentContent = processTemplate(templateContent, row);
        const pdfPage = await convertHtmlToPdf(documentContent);
        pdfPages.push(pdfPage);
      }
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
      placeholders: [], // Add placeholders if needed
      matchedPlaceholders: [], // Add matched placeholders if needed
      csvHeaders: Object.keys(csvData[0]),
      metadata: {
        templateName: templateFile.name,
        csvName: csvFile.name,
      },
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
