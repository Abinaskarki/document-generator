import Papa from "papaparse";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { saveAs } from "file-saver";

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

          // If there are critical errors that prevent parsing, reject
          if (
            results.errors.some(
              (e) => e.type === "Delimiter" || e.type === "FieldMismatch"
            )
          ) {
            reject(new Error(`CSV parsing failed: ${errorMessages}`));
            return;
          }
        }

        // Make sure we have valid data
        if (!results.data || results.data.length === 0) {
          reject(new Error("No valid data found in CSV"));
          return;
        }

        // Validate that we have headers
        const firstRow = results.data[0] as Record<string, string>;
        if (Object.keys(firstRow).length === 0) {
          reject(new Error("CSV file has no headers"));
          return;
        }

        // Check for empty header names (which can happen with trailing commas)
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

  // First, find all placeholders in the template
  const placeholderRegex = /{([^{}]+)}/g;
  const placeholders = new Set<string>();
  let match;

  while ((match = placeholderRegex.exec(template)) !== null) {
    placeholders.add(match[1]);
  }

  if (placeholders.size === 0) {
    throw new Error("No placeholders found in template");
  }

  // Replace all placeholders with the corresponding value from data
  // If a placeholder doesn't have a corresponding value, leave it unchanged
  placeholders.forEach((placeholder) => {
    const regex = new RegExp(`{${placeholder}}`, "g");
    if (data[placeholder] !== undefined) {
      result = result.replace(regex, data[placeholder] || "");
    }
  });

  return result;
}

// Process DOCX templates using docxtemplater
export async function processDocxTemplate(
  docxBuffer: ArrayBuffer,
  data: Record<string, string>
): Promise<Uint8Array> {
  if (!docxBuffer || docxBuffer.byteLength === 0) {
    throw new Error("DOCX file is empty");
  }

  try {
    // Load the docx file as a binary
    const zip = new PizZip(docxBuffer);

    // Initialize docxtemplater with the loaded zip file
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // Set the template variables
    // doc.setData(data)

    try {
      // Render the document (replace all variables with their values)
      console.log(data);
      doc.render(data);
    } catch (error) {
      console.error("Error rendering document:", error);
      throw new Error(
        `Failed to render document: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }

    // Get the zip file as a Uint8Array (works in both browser and Node.js)
    const out = doc.getZip().generate({
      type: "uint8array",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    return out;
  } catch (error) {
    console.error("Error processing DOCX template:", error);
    throw new Error(
      `Failed to process DOCX template: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
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

// Extract placeholders from a DOCX file using docxtemplater
export async function extractPlaceholdersFromDocx(
  docxBuffer: ArrayBuffer
): Promise<string[]> {
  if (!docxBuffer || docxBuffer.byteLength === 0) {
    throw new Error("DOCX file is empty");
  }

  try {
    // Load the docx file as a binary
    const zip = new PizZip(docxBuffer);

    // Get the document.xml content
    let content = "";
    try {
      // Check if the file exists in the zip
      if (!zip.files["word/document.xml"]) {
        throw new Error("Invalid DOCX file: missing document.xml");
      }

      content = zip.files["word/document.xml"].asText();
    } catch (e) {
      console.error("Error reading document.xml:", e);
      throw new Error(
        "Invalid DOCX file structure: " +
          (e instanceof Error ? e.message : String(e))
      );
    }

    // Extract placeholders using regex
    // Docxtemplater uses {placeholder} format
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
    throw new Error(
      `Failed to extract placeholders from DOCX: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
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
