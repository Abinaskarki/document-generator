import { PDFDocument, rgb } from "pdf-lib";

/**
 * Creates a single PDF by merging multiple pages or content.
 * @param pages - An array of strings or ArrayBuffers representing the content of each page.
 * @returns A Uint8Array representing the merged PDF.
 */
export async function createPDF(
  pages: (string | ArrayBuffer)[]
): Promise<Uint8Array> {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();

  for (const pageContent of pages) {
    if (typeof pageContent === "string") {
      // Add a page with text content
      const page = pdfDoc.addPage();
      const { width, height } = page.getSize();
      const fontSize = 12;

      // Split the text into lines to fit the page width
      const lines = splitTextIntoLines(pageContent, width - 50, fontSize);

      // Add text to the page
      lines.forEach((line, index) => {
        page.drawText(line, {
          x: 25,
          y: height - 25 - index * (fontSize + 5),
          size: fontSize,
          color: rgb(0, 0, 0),
        });
      });
    } else if (pageContent instanceof ArrayBuffer) {
      // Add a page from an existing PDF (e.g., DOCX converted to PDF)
      const existingPdfDoc = await PDFDocument.load(pageContent);
      const copiedPages = await pdfDoc.copyPages(
        existingPdfDoc,
        existingPdfDoc.getPageIndices()
      );
      copiedPages.forEach((page) => pdfDoc.addPage(page));
    }
  }

  // Serialize the PDF document to bytes
  return await pdfDoc.save();
}

/**
 * Splits text into lines that fit within a given width.
 * @param text - The text to split.
 * @param maxWidth - The maximum width of a line.
 * @param fontSize - The font size of the text.
 * @returns An array of lines.
 */
function splitTextIntoLines(
  text: string,
  maxWidth: number,
  fontSize: number
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = testLine.length * (fontSize * 0.6); // Approximate character width

    if (testWidth > maxWidth) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}
