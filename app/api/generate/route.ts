import { type NextRequest, NextResponse } from "next/server";
import {
  parseCSV,
  processTemplate,
  processDocxTemplate,
  extractPlaceholders,
  extractPlaceholdersFromDocx,
  arrayBufferToBase64,
} from "@/lib/document-processor";
import { v4 as uuidv4 } from "uuid";
import db from "@/lib/in-memory-db";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const templateFile = formData.get("template") as File;
    const csvFile = formData.get("csv") as File;

    // Validate required files
    if (!templateFile) {
      return NextResponse.json(
        {
          error: "Template file is required",
          details: "Please upload a template file (.docx, .doc, or .html)",
        },
        { status: 400 }
      );
    }

    if (!csvFile) {
      return NextResponse.json(
        {
          error: "CSV file is required",
          details: "Please upload a CSV file with data for your template",
        },
        { status: 400 }
      );
    }

    // Validate file types
    const validTemplateTypes = [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
      "application/msword", // .doc
      "text/html", // .html
      "text/plain", // .txt
    ];

    if (
      !validTemplateTypes.includes(templateFile.type) &&
      !templateFile.name.endsWith(".docx") &&
      !templateFile.name.endsWith(".doc") &&
      !templateFile.name.endsWith(".html") &&
      !templateFile.name.endsWith(".txt")
    ) {
      return NextResponse.json(
        {
          error: "Invalid template file format",
          details: "Template must be a .docx, .doc, .html, or .txt file",
        },
        { status: 400 }
      );
    }

    if (csvFile.type !== "text/csv" && !csvFile.name.endsWith(".csv")) {
      return NextResponse.json(
        {
          error: "Invalid CSV file format",
          details: "Data file must be a valid CSV file",
        },
        { status: 400 }
      );
    }

    // Generate a unique batch ID for this set of documents
    const batchId = `custom-${uuidv4()}`;

    // Read the template file
    const templateBuffer = await templateFile.arrayBuffer();

    // Extract placeholders from the template
    let placeholders: string[] = [];
    try {
      if (
        templateFile.name.endsWith(".docx") ||
        templateFile.name.endsWith(".doc")
      ) {
        placeholders = await extractPlaceholdersFromDocx(templateBuffer);
      } else {
        // For HTML or text templates
        const templateContent = new TextDecoder().decode(templateBuffer);
        placeholders = extractPlaceholders(templateContent);
      }

      if (placeholders.length === 0) {
        return NextResponse.json(
          {
            error: "No placeholders found in template",
            details:
              "Your template must contain placeholders in the format {placeholder_name}",
          },
          { status: 400 }
        );
      }

      console.log("Detected placeholders:", placeholders);
    } catch (error) {
      console.error("Error extracting placeholders:", error);
      return NextResponse.json(
        {
          error: "Failed to extract placeholders from template",
          details:
            error instanceof Error
              ? error.message
              : "Unknown error processing template",
        },
        { status: 500 }
      );
    }

    // Read and parse the CSV file
    let csvData: Record<string, string>[] = [];
    let csvHeaders: string[] = [];

    try {
      const csvBuffer = await csvFile.arrayBuffer();
      const csvContent = new TextDecoder().decode(csvBuffer);

      csvData = await parseCSV(csvContent);

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

      // Extract headers from the CSV data
      csvHeaders = Object.keys(csvData[0]);

      if (csvHeaders.length === 0) {
        return NextResponse.json(
          {
            error: "No headers found in CSV file",
            details:
              "Your CSV file must have headers that match the placeholders in your template",
          },
          { status: 400 }
        );
      }
    } catch (csvError) {
      console.error("CSV parsing error:", csvError);
      return NextResponse.json(
        {
          error: "Failed to parse CSV file",
          details:
            csvError instanceof Error ? csvError.message : "Invalid CSV format",
        },
        { status: 400 }
      );
    }

    // Check if CSV headers match any of the placeholders
    const matchedPlaceholders = placeholders.filter((p) =>
      csvHeaders.includes(p)
    );

    if (matchedPlaceholders.length === 0) {
      return NextResponse.json(
        {
          error: "No matching placeholders found in CSV headers",
          details: {
            message:
              "Your CSV headers don't match any placeholders in your template",
            placeholders,
            csvHeaders,
          },
        },
        { status: 400 }
      );
    }

    // Log the matched placeholders for debugging
    console.log("Matched placeholders:", matchedPlaceholders);
    console.log("CSV headers:", csvHeaders);
    console.log(
      "Unmatched placeholders:",
      placeholders.filter((p) => !csvHeaders.includes(p))
    );

    // Initialize the database
    await db.init();

    // Process each row of CSV data with the template
    try {
      const documents = [];
      const dbDocuments = [];

      for (let index = 0; index < csvData.length; index++) {
        const row = csvData[index];

        // Try to find a field that could be used as a title
        // Look for common title fields first
        const commonTitleFields = [
          "name",
          "title",
          "id",
          "subject",
          "number",
          "reference",
          "invoice_number",
          "receipt_number",
          "contract_number",
          "customer_name",
          "receiver_name",
        ];
        let titleField = null;

        for (const field of commonTitleFields) {
          if (row[field]) {
            titleField = field;
            break;
          }
        }

        // If no common title field found, use the first field with a value
        if (!titleField) {
          for (const field of Object.keys(row)) {
            if (row[field]) {
              titleField = field;
              break;
            }
          }
        }

        const title = titleField
          ? `Document for ${row[titleField]}`
          : `Document #${index + 1}`;
        const documentId = `${batchId}-${index}`;
        const isDocx =
          templateFile.name.endsWith(".docx") ||
          templateFile.name.endsWith(".doc");

        // Process the document based on file type
        if (isDocx) {
          // For DOCX templates, we'll process it with docxtemplater
          const docxData = await processDocxTemplate(templateBuffer, row);
          // Convert to base64 using our cross-platform function
          const docxBase64 = arrayBufferToBase64(docxData);

          const docData = {
            id: documentId,
            batchId,
            title,
            data: row,
            docxBase64: docxBase64,
            placeholders: matchedPlaceholders,
            csvHeaders: csvHeaders,
            originalFormat: "docx",
            originalContent: arrayBufferToBase64(templateBuffer), // Store original document content
          };

          documents.push(docData);
          dbDocuments.push(docData);
        } else {
          // For HTML or text templates
          const templateContent = new TextDecoder().decode(templateBuffer);
          const documentContent = processTemplate(templateContent, row);

          const docData = {
            id: documentId,
            batchId,
            title,
            content: documentContent,
            data: row,
            placeholders: matchedPlaceholders,
            csvHeaders: csvHeaders,
            originalFormat: "html",
            originalContent: templateContent, // Store original document content
          };

          documents.push(docData);
          dbDocuments.push(docData);
        }
      }

      // Create a batch record
      const batch = db.addBatch({
        id: batchId,
        templateId: "custom",
        title: "Custom Template",
        documentCount: documents.length,
        placeholders,
        matchedPlaceholders,
        csvHeaders,
        originalFormat:
          templateFile.name.endsWith(".docx") ||
          templateFile.name.endsWith(".doc")
            ? "docx"
            : "html",
        metadata: {
          templateName: templateFile.name,
          csvName: csvFile.name,
          unmatchedPlaceholders: placeholders.filter(
            (p) => !csvHeaders.includes(p)
          ),
        },
      });

      // Add documents to the database
      db.addDocuments(dbDocuments);

      // Return additional information about the CSV and placeholders
      return NextResponse.json({
        batchId,
        documentCount: documents.length,
        placeholders: placeholders,
        matchedPlaceholders: matchedPlaceholders,
        unmatchedPlaceholders: placeholders.filter(
          (p) => !csvHeaders.includes(p)
        ),
        csvHeaders: csvHeaders,
        originalFormat:
          templateFile.name.endsWith(".docx") ||
          templateFile.name.endsWith(".doc")
            ? "docx"
            : "html",
        success: true,
      });
    } catch (processingError) {
      console.error("Error processing documents:", processingError);
      return NextResponse.json(
        {
          error: "Failed to process documents",
          details:
            processingError instanceof Error
              ? processingError.message
              : "Error generating documents from template and data",
        },
        { status: 500 }
      );
    }
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
