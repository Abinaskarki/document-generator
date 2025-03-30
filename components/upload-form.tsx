"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { FileUploader } from "./file-uploader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";
import mammoth from "mammoth";

export default function UploadForm() {
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [templatePreview, setTemplatePreview] = useState<string | null>(null);
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Function to preview the template file
  const previewTemplate = async (file: File) => {
    try {
      if (file.name.endsWith(".docx") || file.name.endsWith(".doc")) {
        const arrayBuffer = await file.arrayBuffer();
        const { value: htmlContent } = await mammoth.convertToHtml({
          arrayBuffer,
        });
        const styledHtmlContent = `
          <style>
            p { margin-bottom: 1em; }
          </style>
          ${htmlContent}
        `;
        setTemplatePreview(styledHtmlContent);
      } else if (file.name.endsWith(".html")) {
        const textContent = await file.text();
        setTemplatePreview(textContent);
      } else {
        setTemplatePreview("Unsupported file format for preview.");
      }
    } catch (error) {
      console.error("Error previewing template:", error);
      setTemplatePreview("Failed to preview the template.");
    }
  };

  // Function to preview the CSV file
  const previewCsv = async (file: File) => {
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
      setCsvHeaders(headers);
      setCsvPreview(data);
    } catch (error) {
      console.error("Error previewing CSV:", error);
      setCsvPreview([]);
    }
  };

  // Handle template file change
  const handleTemplateChange = (file: File | null) => {
    setTemplateFile(file);
    setError(null);
    if (file) {
      previewTemplate(file);
    } else {
      setTemplatePreview(null);
    }
  };

  // Handle CSV file change
  const handleCsvChange = (file: File | null) => {
    setCsvFile(file);
    setError(null);
    if (file) {
      previewCsv(file);
    } else {
      setCsvPreview([]);
      setCsvHeaders([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!templateFile || !csvFile) {
      setError("Both template and CSV files are required");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Process the files (e.g., send to API)
      console.log("Processing files...");
    } catch (error) {
      console.error("Error generating documents:", error);
      setError("Failed to generate documents.");
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
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Template Upload */}
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

            {templatePreview && (
              <div className="mt-4 p-3 bg-muted rounded-md">
                <h3 className="text-sm font-medium mb-2">Template Preview</h3>
                <div
                  className="text-sm bg-white p-3 border rounded-md overflow-auto"
                  dangerouslySetInnerHTML={{ __html: templatePreview }}
                />
              </div>
            )}
          </div>

          {/* CSV Upload */}
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

            {csvPreview.length > 0 && (
              <div className="mt-4 p-3 bg-muted rounded-md">
                <h3 className="text-sm font-medium mb-2">CSV Preview</h3>
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
                    {csvPreview.slice(0, 5).map((row, index) => (
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
                  Showing the first 5 rows of your CSV file.
                </p>
              </div>
            )}
          </div>

          {/* Submit Button */}
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
