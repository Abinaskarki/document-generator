import { type NextRequest, NextResponse } from "next/server";
import { parseCSV, processTemplate } from "@/lib/document-processor";
import { v4 as uuidv4 } from "uuid";
import { collection, doc, setDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db } from "@/lib/firebase";
import puppeteer from "puppeteer";
import { PDFDocument } from "pdf-lib";

const storage = getStorage();

export async function POST(request: NextRequest) {
  try {
    const { templateHtml, data } = await request.json();

    // Validate required fields
    if (!templateHtml || !data || data.length === 0) {
      return NextResponse.json(
        {
          error: "Both template HTML and data are required",
          details: "Please provide a valid template and data",
        },
        { status: 400 }
      );
    }

    // Generate a unique batch ID
    const batchId = `custom-${uuidv4()}`;

    // Generate documents and merge them into a single PDF
    const pdfPages: Uint8Array[] = [];

    for (const row of data) {
      // Replace placeholders in the HTML content
      const processedHtml = processTemplate(templateHtml, row);

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

    // Upload the generated PDF to Firebase Storage with metadata
    const pdfRef = ref(storage, `pdf/${batchId}/generated-document.pdf`);
    const pdfMetadata = {
      contentType: "application/pdf", // Explicitly set the Content-Type
    };
    await uploadBytes(pdfRef, pdfBuffer, pdfMetadata);
    const pdfDownloadUrl = await getDownloadURL(pdfRef);

    // Store batch metadata in Firestore
    await setDoc(doc(db, "batches", batchId), {
      id: batchId,
      pdf: {
        downloadUrl: pdfDownloadUrl,
      },
      documentCount: data.length,
    });

    return NextResponse.json({
      batchId,
      documentCount: data.length,
      pdfDownloadUrl,
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
