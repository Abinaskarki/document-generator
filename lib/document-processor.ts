import Papa from "papaparse";
import mammoth from "mammoth";
import { saveAs } from "file-saver";
import PizZip from "pizzip";

// Parse CSV file
export async function parseCSV(
  csvContent: string
): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors && results.errors.length > 0) {
          const errorMessages = results.errors
            .map((err) => `${err.message} at row ${err.row || "unknown"}`)
            .join("; ");
          console.warn("CSV parsing had errors:", results.errors);

          if (
            results.errors.some(
              (e) => e.type === "Delimiter" || e.type === "FieldMismatch"
            )
          ) {
            reject(new Error(`CSV parsing failed: ${errorMessages}`));
            return;
          }
        }

        if (!results.data || results.data.length === 0) {
          reject(new Error("No valid data found in CSV"));
          return;
        }

        const firstRow = results.data[0] as Record<string, string>;
        if (Object.keys(firstRow).length === 0) {
          reject(new Error("CSV file has no headers"));
          return;
        }

        const emptyHeaders = Object.keys(firstRow).filter(
          (key) => key.trim() === ""
        );
        if (emptyHeaders.length > 0) {
          reject(
            new Error(
              "CSV contains empty header names. Please check for trailing commas or formatting issues."
            )
          );
          return;
        }

        resolve(results.data as Record<string, string>[]);
      },
      error: (error) => {
        reject(new Error(`CSV parsing error: ${error.message}`));
      },
    });
  });
}

// Process HTML or text templates
export function processTemplate(
  template: string,
  data: Record<string, string>
): string {
  if (!template) {
    throw new Error("Template content is empty");
  }

  let result = template;

  const placeholderRegex = /{([^{}]+)}/g;
  const placeholders = new Set<string>();
  let match;

  while ((match = placeholderRegex.exec(template)) !== null) {
    placeholders.add(match[1]);
  }

  if (placeholders.size === 0) {
    throw new Error("No placeholders found in template");
  }

  placeholders.forEach((placeholder) => {
    const regex = new RegExp(`{${placeholder}}`, "g");
    if (data[placeholder] !== undefined) {
      result = result.replace(regex, data[placeholder] || "");
    }
  });

  return result;
}

// Process DOCX templates using Mammoth
export async function processDocxTemplate(
  docxBuffer: ArrayBuffer,
  data: Record<string, string>
): Promise<string> {
  if (!docxBuffer || docxBuffer.byteLength === 0) {
    throw new Error("DOCX file is empty");
  }

  try {
    // Convert DOCX to HTML using Mammoth
    const { value: htmlContent } = await mammoth.convertToHtml(
      { arrayBuffer: docxBuffer },
      {
        styleMap: [
          "p => p:fresh",
          "r => span:fresh",
          "b => strong",
          "i => em",
          "u => u",
          "strike => strike",
          "h1 => h1:fresh",
          "h2 => h2:fresh",
          "h3 => h3:fresh",
          "h4 => h4:fresh",
          "h5 => h5:fresh",
          "h6 => h6:fresh",
          "ul => ul:fresh",
          "ol => ol:fresh",
          "li => li:fresh",
          "table => table:fresh",
          "tr => tr:fresh",
          "td => td:fresh",
          "th => th:fresh",
          "blockquote => blockquote:fresh",
          "pre => pre:fresh",
          "code => code:fresh",
        ],
      }
    );

    // Replace placeholders in the HTML content
    let processedHtml = htmlContent;
    Object.keys(data).forEach((key) => {
      const regex = new RegExp(`{${key}}`, "g");
      processedHtml = processedHtml.replace(regex, data[key] || "");
    });

    // Add custom CSS for paragraph spacing
    const htmlWithStyles = `
      <style>
        p { margin-bottom: 1em; }
      </style>
      ${processedHtml}
    `;

    return htmlWithStyles;
  } catch (error) {
    console.error("Error processing DOCX template with Mammoth:", error);
    throw new Error("Failed to process DOCX template");
  }
}

// Convert Uint8Array to base64 (works in both browser and Node.js)
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  // In Node.js environment
  if (typeof window === "undefined") {
    return Buffer.from(buffer).toString("base64");
  }

  // In browser environment
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Convert base64 to Blob (browser only)
export function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);

    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  return new Blob(byteArrays, { type: mimeType });
}

// Extract placeholders from a template
export function extractPlaceholders(template: string): string[] {
  if (!template) {
    throw new Error("Template content is empty");
  }

  const placeholderRegex = /{([^{}]+)}/g;
  const placeholders = new Set<string>();
  let match;

  while ((match = placeholderRegex.exec(template)) !== null) {
    placeholders.add(match[1]);
  }

  return Array.from(placeholders);
}

export async function extractPlaceholdersFromDocx(
  docxBuffer: ArrayBuffer
): Promise<string[]> {
  if (!docxBuffer || docxBuffer.byteLength === 0) {
    throw new Error("DOCX file is empty or invalid");
  }

  try {
    // Load the DOCX file as a ZIP archive
    const zip = new PizZip(docxBuffer);

    // Check if the file contains "word/document.xml"
    if (!zip.files["word/document.xml"]) {
      throw new Error(
        "The DOCX file is missing required content (word/document.xml)"
      );
    }

    // Extract the content of "word/document.xml"
    const content = zip.files["word/document.xml"].asText();
    console.log("Successfully extracted document.xml content");

    // Extract placeholders using a regex
    const placeholderRegex = /{([^{}]+)}/g;
    const placeholders = new Set<string>();
    let match;

    while ((match = placeholderRegex.exec(content)) !== null) {
      placeholders.add(match[1]);
    }

    if (placeholders.size === 0) {
      throw new Error("No placeholders found in DOCX template");
    }

    return Array.from(placeholders);
  } catch (error) {
    console.error("Error extracting placeholders from DOCX:", error);
    throw new Error("Failed to extract placeholders from DOCX");
  }
}

// Helper function to escape HTML special characters
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Download DOCX file (browser only)
export function downloadDocx(docxBlob: Blob, filename: string): void {
  saveAs(docxBlob, filename);
}
