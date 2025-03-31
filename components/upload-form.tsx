"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { FileUploader } from "./file-uploader";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { useDocuments } from "@/lib/document-context";
import mammoth from "mammoth";

export default function UploadForm() {
  const router = useRouter();
  const { addBatch } = useDocuments();
  const [isLoading, setIsLoading] = useState(false);
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [templatePreview, setTemplatePreview] = useState<string | null>(null);
  const [dataPreview, setDataPreview] = useState<any[]>([]);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detectedPlaceholders, setDetectedPlaceholders] = useState<string[]>(
    []
  );
  const [isAnalyzingTemplate, setIsAnalyzingTemplate] = useState(false);
  const [placeholders, setPlaceholders] = useState<string[]>([]);
  const [dataHeaders, setDataHeaders] = useState<string[]>([]);
  const [dataFile, setDataFile] = useState<File | null>(null);
  // Add state for CSV headers
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [isAnalyzingCsv, setIsAnalyzingCsv] = useState(false);
  const [matchedFields, setMatchedFields] = useState<string[]>([]);

  const previewTemplate = async (file: File) => {
    try {
      if (file.name.endsWith(".docx") || file.name.endsWith(".doc")) {
        const arrayBuffer = await file.arrayBuffer();
        const { value: htmlContent } = await mammoth.convertToHtml({
          arrayBuffer,
        });
        setTemplatePreview(htmlContent);

        // Extract placeholders (e.g., {field_name})
        const matches = htmlContent.match(/{(.*?)}/g) || [];
        setPlaceholders(
          matches.map((placeholder) => placeholder.replace(/[{}]/g, ""))
        );
      } else if (file.name.endsWith(".html")) {
        const textContent = await file.text();
        setTemplatePreview(textContent);

        // Extract placeholders (e.g., {field_name})
        const matches = textContent.match(/{(.*?)}/g) || [];
        setPlaceholders(
          matches.map((placeholder) => placeholder.replace(/[{}]/g, ""))
        );
      } else {
        setTemplatePreview("Unsupported file format for preview.");
      }
    } catch (error) {
      console.error("Error previewing template:", error);
      setTemplatePreview("Failed to preview the template.");
    }
  };

  const previewDataFile = async (file: File) => {
    try {
      const textContent = await file.text();
      const rows = textContent.split("\n").map((row) => row.split(","));
      const headers = rows[0];
      const data = rows.slice(1).map((row) =>
        headers.reduce((acc, header, index) => {
          acc[header] = row[index];
          return acc;
        }, {} as Record<string, string>)
      );
      setDataHeaders(headers);
      setDataPreview(data);
    } catch (error) {
      console.error("Error previewing data file:", error);
      setDataPreview([]);
    }
  };

  // Function to analyze the template and extract placeholders
  const analyzeTemplate = async (file: File) => {
    if (!file) return;

    setIsAnalyzingTemplate(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("template", file);

      const response = await fetch("/api/analyze-template", {
        method: "POST",
        body: formData,
      });

      // Check if the response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        // Handle non-JSON response
        const text = await response.text();
        console.error("Non-JSON response:", text);
        throw new Error(
          "Server returned an invalid response. Please try again or contact support."
        );
      }

      const data = await response.json();

      if (!response.ok) {
        console.error("Template analysis error:", data);
        throw new Error(
          data.details || data.error || "Failed to analyze template"
        );
      }

      setDetectedPlaceholders(data.placeholders || []);

      // If we have CSV headers, update matched fields
      if (csvHeaders.length > 0) {
        const matches = data.placeholders.filter((p: string) =>
          csvHeaders.includes(p)
        );
        setMatchedFields(matches);
      }
    } catch (error) {
      console.error("Error analyzing template:", error);
      setError(
        `Error analyzing template: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      setDetectedPlaceholders([]);
    } finally {
      setIsAnalyzingTemplate(false);
    }
  };

  // Add function to analyze CSV and extract headers
  const analyzeCsv = async (file: File) => {
    if (!file) return;

    setIsAnalyzingCsv(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("csv", file);

      const response = await fetch("/api/analyze-csv", {
        method: "POST",
        body: formData,
      });

      // Check if the response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        // Handle non-JSON response
        const text = await response.text();
        console.error("Non-JSON response:", text);
        throw new Error(
          "Server returned an invalid response. Please try again or contact support."
        );
      }

      const data = await response.json();

      if (!response.ok) {
        console.error("CSV analysis error:", data);
        throw new Error(data.details || data.error || "Failed to analyze CSV");
      }

      setCsvHeaders(data.headers || []);

      // If we have both placeholders and CSV headers, show matches
      if (detectedPlaceholders.length > 0 && data.headers.length > 0) {
        const matches = detectedPlaceholders.filter((p) =>
          data.headers.includes(p)
        );
        setMatchedFields(matches);
      }
    } catch (error) {
      console.error("Error analyzing CSV:", error);
      setError(
        `Error analyzing CSV: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      setCsvHeaders([]);
      setMatchedFields([]);
    } finally {
      setIsAnalyzingCsv(false);
    }
  };

  // When template file changes, analyze it
  const handleTemplateChange = (file: File | null) => {
    setTemplateFile(file);
    setError(null);
    if (file) {
      previewTemplate(file);
      analyzeTemplate(file);
    } else {
      setTemplatePreview(null);
      setDetectedPlaceholders([]);
      setMatchedFields([]);
    }
  };

  // Update the CSV file change handler
  const handleCsvChange = (file: File | null) => {
    setCsvFile(file);

    setError(null);
    if (file) {
      previewDataFile(file);
      analyzeCsv(file);
    } else {
      setCsvHeaders([]);
      setMatchedFields([]);
    }
  };

  // Enhance error display in the upload form
  // Update the error handling in the form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!templateFile || !csvFile) {
      setError("Both template and CSV files are required");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Convert the template file to HTML using Mammoth
      let convertedHtml = "";
      if (
        templateFile.name.endsWith(".docx") ||
        templateFile.name.endsWith(".doc")
      ) {
        const arrayBuffer = await templateFile.arrayBuffer();
        const { value: htmlContent } = await mammoth.convertToHtml({
          arrayBuffer,
        });
        convertedHtml = htmlContent;
      } else {
        // If the file is not DOCX, read it as plain text
        const textContent = await templateFile.text();
        convertedHtml = textContent;
      }

      // Prepare the form data
      const formData = new FormData();
      formData.append(
        "templateHtml",
        new Blob([convertedHtml], { type: "text/html" })
      );
      formData.append("csv", csvFile);

      // Send the form data to the API
      const response = await fetch("/api/generate-documents", {
        method: "POST",
        body: formData,
      });

      // Check if the response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        // Handle non-JSON response
        const text = await response.text();
        console.error("Non-JSON response:", text);
        throw new Error(
          "Server returned an invalid response. Please try again or contact support."
        );
      }

      const data = await response.json();

      if (!response.ok) {
        console.error("Server response:", data);

        // Display detailed error information
        if (data.details) {
          if (typeof data.details === "object") {
            // For structured error details
            const errorDetails = data.details;
            let errorMessage = `${data.error}. `;

            if (errorDetails.message) {
              errorMessage += errorDetails.message;
            }

            if (errorDetails.placeholders && errorDetails.csvHeaders) {
              errorMessage += `\n\nTemplate placeholders: ${errorDetails.placeholders.join(
                ", "
              )}\n`;
              errorMessage += `CSV headers: ${errorDetails.csvHeaders.join(
                ", "
              )}`;
            }

            if (errorDetails.missingFields) {
              errorMessage += `\n\nMissing fields: ${errorDetails.missingFields.join(
                ", "
              )}`;
            }

            throw new Error(errorMessage);
          } else {
            // For string error details
            throw new Error(`${data.error}: ${data.details}`);
          }
        } else {
          throw new Error(data.error || response.statusText);
        }
      }

      // Store the batch information in context
      addBatch({
        batchId: data.batchId,
        templateId: data.templateId || "custom",
        documentCount: data.documentCount,
        placeholders: data.placeholders,
        matchedPlaceholders: data.matchedPlaceholders,
        unmatchedPlaceholders: data.unmatchedPlaceholders,
        csvHeaders: data.csvHeaders,
        originalFormat: data.originalFormat,
      });

      router.push(`/documents/${data.batchId}`);
    } catch (error) {
      console.error("Error generating documents:", error);
      setError(
        error instanceof Error ? error.message : "Failed to generate documents"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription className="whitespace-pre-line">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="template">Document Template</Label>
            <FileUploader
              id="template"
              accept=".docx,.doc,.html"
              onChange={handleTemplateChange}
              value={templateFile}
              placeholder="Upload document template (.docx, .doc, .html)"
            />
            <p className="text-sm text-gray-500">
              Upload a document with placeholders like {"{field_name}"} that
              will be replaced with data from your CSV.
            </p>

            {isAnalyzingTemplate && (
              <p className="text-sm text-blue-500 mt-2">
                Analyzing template...
              </p>
            )}

            {templateFile && (
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Template Preview</h3>
                <div
                  className="text-sm bg-white p-3 border rounded-md overflow-auto"
                  dangerouslySetInnerHTML={{
                    __html: templatePreview || "No preview available",
                  }}
                />
              </div>
            )}

            {detectedPlaceholders.length > 0 && (
              <div className="mt-4 p-3 bg-muted rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">
                    Detected Placeholders
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {detectedPlaceholders.map((placeholder) => (
                    <div
                      key={placeholder}
                      className="text-xs bg-background px-2 py-1 rounded border"
                    >
                      {placeholder}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Make sure your CSV has columns with these exact names.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="csv">CSV Data File</Label>
            <FileUploader
              id="csv"
              accept=".csv"
              onChange={handleCsvChange}
              value={csvFile}
              placeholder="Upload CSV file with your data"
            />
            <p className="text-sm text-gray-500">
              Your CSV should have headers that match the placeholders in your
              template.
            </p>

            {isAnalyzingCsv && (
              <p className="text-sm text-blue-500 mt-2">
                Analyzing CSV file...
              </p>
            )}
            {csvHeaders.length > 0 && dataPreview.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">CSV/XLSX Preview</h3>
                <table className="table-auto w-full border-collapse border border-gray-300">
                  <thead>
                    <tr>
                      {csvHeaders.map((header) => (
                        <th
                          key={header}
                          className="border border-gray-300 px-4 py-2 text-left text-sm font-medium"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dataPreview.slice(0, 5).map((row, index) => (
                      <tr key={index}>
                        {csvHeaders.map((header) => (
                          <td
                            key={header}
                            className="border border-gray-300 px-4 py-2 text-sm"
                          >
                            {row[header] || ""}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-xs text-gray-500 mt-2">
                  Showing the first 5 rows of your CSV/XLSX file.
                </p>
              </div>
            )}

            {csvHeaders.length > 0 && (
              <div className="mt-4 p-3 bg-muted rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">CSV Headers</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {csvHeaders.map((header) => (
                    <div
                      key={header}
                      className={`text-xs px-2 py-1 rounded border ${
                        detectedPlaceholders.includes(header)
                          ? "bg-green-100 border-green-300 text-green-800"
                          : "bg-background border-gray-200"
                      }`}
                    >
                      {header}
                      {detectedPlaceholders.includes(header) && (
                        <span className="ml-1 text-green-600">✓</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {matchedFields.length > 0 && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">
                    {matchedFields.length} of {detectedPlaceholders.length}{" "}
                    placeholders matched with CSV headers
                  </span>
                </div>
                {matchedFields.length < detectedPlaceholders.length && (
                  <p className="text-xs text-amber-600 mt-1">
                    Warning: Some placeholders in your template don't match any
                    CSV headers.
                  </p>
                )}
              </div>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={!templateFile || !csvFile || isLoading}
          >
            {isLoading ? "Processing..." : "Generate Documents"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
