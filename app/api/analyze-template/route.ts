import { type NextRequest, NextResponse } from "next/server";
import { extractPlaceholders } from "@/lib/document-processor";
import PizZip from "pizzip";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const templateFile = formData.get("template") as File;

    if (!templateFile) {
      return NextResponse.json(
        {
          error: "Template file is required",
          details: "Please upload a template file to analyze",
        },
        { status: 400 }
      );
    }

    // Validate file type
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

    // Read the template file
    const templateBuffer = await templateFile.arrayBuffer();

    if (!templateBuffer || templateBuffer.byteLength === 0) {
      return NextResponse.json(
        {
          error: "Template file is empty",
          details: "The uploaded file contains no data",
        },
        { status: 400 }
      );
    }

    // Extract placeholders from the template
    try {
      let placeholders: string[] = [];

      if (
        templateFile.name.endsWith(".docx") ||
        templateFile.name.endsWith(".doc")
      ) {
        // For DOCX files, use a simpler approach to extract placeholders
        try {
          console.log(
            "Processing DOCX file:",
            templateFile.name,
            "Size:",
            templateBuffer.byteLength
          );

          // Load the docx file as a binary
          const zip = new PizZip(templateBuffer);

          // Get the document.xml content
          let content = "";
          try {
            // Check if the file exists in the zip
            if (!zip.files["word/document.xml"]) {
              console.error("Missing document.xml in DOCX file");
              return NextResponse.json(
                {
                  error: "Invalid DOCX file structure",
                  details:
                    "The DOCX file is missing required content (document.xml)",
                },
                { status: 400 }
              );
            }

            content = zip.files["word/document.xml"].asText();
            console.log("Successfully extracted document.xml content");
          } catch (e) {
            console.error("Error reading document.xml:", e);
            return NextResponse.json(
              {
                error: "Invalid DOCX file structure",
                details:
                  "Could not read document content: " +
                  (e instanceof Error ? e.message : String(e)),
              },
              { status: 400 }
            );
          }

          // Extract placeholders using regex
          const placeholderRegex = /{([^{}]+)}/g;
          const placeholdersSet = new Set<string>();
          let match;

          while ((match = placeholderRegex.exec(content)) !== null) {
            placeholdersSet.add(match[1]);
          }

          if (placeholdersSet.size === 0) {
            return NextResponse.json(
              {
                error: "No placeholders found in DOCX template",
                details:
                  "Your template must contain placeholders in the format {placeholder_name}",
              },
              { status: 400 }
            );
          }

          placeholders = Array.from(placeholdersSet);
          console.log("Extracted placeholders:", placeholders);
        } catch (docxError) {
          console.error("Error extracting placeholders from DOCX:", docxError);
          return NextResponse.json(
            {
              error: "Failed to extract placeholders from DOCX",
              details:
                docxError instanceof Error
                  ? docxError.message
                  : "Invalid DOCX file",
            },
            { status: 400 }
          );
        }
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

      return NextResponse.json({
        placeholders,
        count: placeholders.length,
        fileType:
          templateFile.name.endsWith(".docx") ||
          templateFile.name.endsWith(".doc")
            ? "docx"
            : "html/text",
        success: true,
      });
    } catch (extractionError) {
      console.error("Error extracting placeholders:", extractionError);
      return NextResponse.json(
        {
          error: "Failed to extract placeholders",
          details:
            extractionError instanceof Error
              ? extractionError.message
              : "Error processing template",
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error analyzing template:", error);
    return NextResponse.json(
      {
        error: "Failed to analyze template",
        details:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
