import { type NextRequest, NextResponse } from "next/server";
import { parseCSV, processTemplate } from "@/lib/document-processor";
import { getDefaultTemplate } from "@/lib/default-templates";
import { v4 as uuidv4 } from "uuid";
import db from "@/lib/in-memory-db";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const templateId = formData.get("templateId") as string;
    const csvFile = formData.get("csv") as File;

    // Validate required inputs
    if (!templateId) {
      return NextResponse.json(
        {
          error: "Template ID is required",
          details: "Please select a template",
        },
        { status: 400 }
      );
    }

    if (!csvFile) {
      return NextResponse.json(
        {
          error: "CSV file is required",
          details: "Please upload a CSV file with your data",
        },
        { status: 400 }
      );
    }

    // Validate CSV file type
    if (csvFile.type !== "text/csv" && !csvFile.name.endsWith(".csv")) {
      return NextResponse.json(
        {
          error: "Invalid CSV file format",
          details: "Data file must be a valid CSV file",
        },
        { status: 400 }
      );
    }

    // Get the default template content
    const templateContent = getDefaultTemplate(templateId);

    if (!templateContent) {
      return NextResponse.json(
        {
          error: "Invalid template ID",
          details: `Template '${templateId}' not found`,
        },
        { status: 400 }
      );
    }

    // Generate a unique batch ID for this set of documents
    // Include the template ID in the batch ID for easier identification
    const batchId = `${templateId}-${uuidv4()}`;

    // Read and parse the CSV file
    try {
      const csvBuffer = await csvFile.arrayBuffer();
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

      // Get the CSV headers
      const csvHeaders = Object.keys(csvData[0]);

      // Check for required fields based on template type
      const requiredFields = getRequiredFieldsForTemplate(templateId);
      const missingFields = requiredFields.filter(
        (field) => !csvHeaders.includes(field)
      );

      if (missingFields.length > 0) {
        return NextResponse.json(
          {
            error: "Missing required fields in CSV",
            details: {
              message: "Your CSV is missing required fields for this template",
              missingFields,
              requiredFields,
              csvHeaders,
            },
          },
          { status: 400 }
        );
      }

      // Initialize the database
      await db.init();

      // Process each row of CSV data with the template
      try {
        const documents = [];
        const dbDocuments = [];

        for (let index = 0; index < csvData.length; index++) {
          const row = csvData[index];
          const documentContent = processTemplate(templateContent, row);
          const documentId = `${batchId}-${index}`;

          // Create a title based on the template type
          let title = "";
          if (templateId === "invoice") {
            title = `Invoice #${row.invoice_number || `INV-${index + 1}`}`;
          } else if (templateId === "receipt") {
            title = `Receipt #${row.receipt_number || `REC-${index + 1}`}`;
          } else if (templateId === "contract") {
            title = `Contract between ${row.party1_name || "Party 1"} and ${
              row.party2_name || "Party 2"
            }`;
          } else {
            title = `Document #${index + 1}`;
          }

          const docData = {
            id: documentId,
            batchId,
            title,
            content: documentContent,
            data: row,
            placeholders: requiredFields,
            csvHeaders,
            originalFormat: "html",
          };

          documents.push(docData);
          dbDocuments.push(docData);
        }

        // Format template name for display
        const templateName = `${
          templateId.charAt(0).toUpperCase() + templateId.slice(1)
        } Template`;

        // Create a batch record
        const batch = db.addBatch({
          id: batchId,
          templateId,
          title: templateName,
          documentCount: documents.length,
          placeholders: requiredFields,
          csvHeaders,
          originalFormat: "html",
          metadata: {
            csvName: csvFile.name,
          },
        });

        // Add documents to the database
        db.addDocuments(dbDocuments);

        return NextResponse.json({
          batchId,
          templateId,
          documentCount: documents.length,
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

// Helper function to get required fields for a template
function getRequiredFieldsForTemplate(templateId: string): string[] {
  switch (templateId) {
    case "invoice":
      return [
        "invoice_number",
        "customer_name",
        "item_description",
        "amount",
        "due_date",
      ];
    case "receipt":
      return ["receipt_number", "customer_name", "item_name", "amount", "date"];
    case "contract":
      return [
        "party1_name",
        "party2_name",
        "contract_purpose",
        "start_date",
        "end_date",
      ];
    default:
      return [];
  }
}
