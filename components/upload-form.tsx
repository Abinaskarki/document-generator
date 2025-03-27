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

export default function UploadForm() {
  const router = useRouter();
  const { addBatch, addDocuments } = useDocuments();
  const [isLoading, setIsLoading] = useState(false);
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detectedPlaceholders, setDetectedPlaceholders] = useState<string[]>(
    []
  );
  const [isAnalyzingTemplate, setIsAnalyzingTemplate] = useState(false);
  const [batchName, setBatchName] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  // Add state for CSV headers
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [isAnalyzingCsv, setIsAnalyzingCsv] = useState(false);
  const [matchedFields, setMatchedFields] = useState<string[]>([]);

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
      analyzeTemplate(file);
    } else {
      setDetectedPlaceholders([]);
      setMatchedFields([]);
    }
  };

  // Update the CSV file change handler
  const handleCsvChange = (file: File | null) => {
    setCsvFile(file);
    setError(null);
    if (file) {
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
      const formData = new FormData();
      formData.append("template", templateFile);
      formData.append("csv", csvFile);

      const response = await fetch("/api/generate", {
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

  const handleUpload = () => {
    const batchId = Date.now().toString();
    addBatch({ id: batchId, name: batchName });
    addDocuments(
      batchId,
      files.map((file) => ({ name: file.name, content: "" }))
    );
    setBatchName("");
    setFiles([]);
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
        <Button onClick={handleUpload}>Upload</Button>
      </CardContent>
    </Card>
  );
}
