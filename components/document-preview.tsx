"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Download, Edit, X } from "lucide-react";
import { processTemplate } from "@/lib/document-processor";
import { getDefaultTemplate } from "@/lib/default-templates";
import { useState, useEffect } from "react";
import { base64ToBlob } from "@/lib/document-processor";
import mammoth from "mammoth";

interface DocumentPreviewProps {
  document: {
    id: string;
    title: string;
    data: Record<string, string>;
    templateId?: string;
    content?: string;
    docxBase64?: string;
    placeholders?: string[];
    originalFormat?: string;
    csvHeaders?: string[];
  };
  onClose: () => void;
  onEdit: () => void;
}

export default function DocumentPreview({
  document,
  onClose,
  onEdit,
}: DocumentPreviewProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [docxBlob, setDocxBlob] = useState<Blob | null>(null);
  const [docxHtml, setDocxHtml] = useState<string | null>(null);

  // Convert base64 to Blob when component mounts (browser-only)
  useEffect(() => {
    if (document.docxBase64 && typeof window !== "undefined") {
      try {
        // Extract the base64 data (remove the data URL prefix if present)
        const base64Data = document.docxBase64.includes("base64,")
          ? document.docxBase64.split("base64,")[1]
          : document.docxBase64;

        const blob = base64ToBlob(
          base64Data,
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        );
        setDocxBlob(blob);

        // Convert DOCX to HTML with custom style mappings
        const reader = new FileReader();
        reader.onload = async (e) => {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const result = await mammoth.convertToHtml({
            arrayBuffer,
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
          });
          // Add custom CSS for paragraph spacing
          const htmlWithStyles = `
            <style>
              p { margin-bottom: 1em; }
            </style>
            ${result.value}
          `;
          setDocxHtml(htmlWithStyles);
        };
        reader.readAsArrayBuffer(blob);
      } catch (error) {
        console.error("Error converting base64 to blob:", error);
      }
    }
  }, [document.docxBase64]);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      if (document.docxBase64 && docxBlob) {
        // For DOCX documents, download the blob
        const a = document.createElement("a");
        const url = URL.createObjectURL(docxBlob);
        a.href = url;
        a.download = `${document.title
          .replace(/[^a-z0-9]/gi, "_")
          .toLowerCase()}.docx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else if (document.content) {
        // For HTML content, create a download link
        const blob = new Blob([document.content], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${document.title
          .replace(/[^a-z0-9]/gi, "_")
          .toLowerCase()}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Error downloading document:", error);
      // You could show an error message here
    } finally {
      setIsDownloading(false);
    }
  };

  // DOCX Preview
  if (document.docxBase64) {
    return (
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>{document.title}</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={isDownloading || !docxBlob}
            >
              <Download className="h-4 w-4 mr-2" />
              {isDownloading ? "Downloading..." : "Download DOCX"}
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md p-4 bg-white overflow-auto max-h-[70vh]">
            {docxHtml ? (
              <div dangerouslySetInnerHTML={{ __html: docxHtml }} />
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[500px] text-center p-8">
                <div className="mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="64"
                    height="64"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-blue-600"
                  >
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  DOCX Document Preview
                </h3>
                <p className="text-gray-500 mb-4">
                  This document is in DOCX format and cannot be previewed
                  directly in the browser.
                </p>
                <Button
                  onClick={handleDownload}
                  disabled={isDownloading || !docxBlob}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isDownloading ? "Downloading..." : "Download DOCX File"}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-start space-y-4">
          <div className="w-full flex justify-between">
            <div className="text-sm text-muted-foreground">
              <span className="px-2 py-1 bg-muted rounded-full text-xs mr-2">
                DOCX
              </span>
              Original formatting preserved
            </div>
            <Button variant="outline" onClick={onClose}>
              Close Preview
            </Button>
          </div>

          {document.placeholders && document.placeholders.length > 0 && (
            <div className="w-full mt-4 p-3 bg-muted rounded-md">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium">Placeholders Used</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {document.placeholders.map((placeholder) => (
                  <div
                    key={placeholder}
                    className="text-xs bg-green-100 border border-green-300 text-green-800 px-2 py-1 rounded"
                  >
                    {placeholder}: {document.data[placeholder] || ""}
                  </div>
                ))}
              </div>
            </div>
          )}

          {document.csvHeaders && document.csvHeaders.length > 0 && (
            <div className="w-full mt-2 p-3 bg-muted rounded-md">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium">CSV Headers</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {document.csvHeaders.map((header) => (
                  <div
                    key={header}
                    className={`text-xs px-2 py-1 rounded border ${
                      document.placeholders?.includes(header)
                        ? "bg-green-100 border-green-300 text-green-800"
                        : "bg-background border-gray-200"
                    }`}
                  >
                    {header}
                    {document.placeholders?.includes(header) && (
                      <span className="ml-1 text-green-600">✓</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardFooter>
      </Card>
    );
  }

  // HTML Content Preview
  if (document.content) {
    return (
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>{document.title}</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={isDownloading}
            >
              <Download className="h-4 w-4 mr-2" />
              {isDownloading ? "Downloading..." : "Download HTML"}
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md p-4 bg-white overflow-auto max-h-[70vh]">
            <iframe
              srcDoc={document.content}
              title={document.title}
              className="w-full min-h-[500px] border-0"
              sandbox="allow-same-origin"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-start space-y-4">
          <div className="w-full flex justify-between">
            <div className="text-sm text-muted-foreground">
              {document.originalFormat && (
                <span className="px-2 py-1 bg-muted rounded-full text-xs mr-2">
                  {document.originalFormat.toUpperCase()}
                </span>
              )}
              Original formatting preserved
            </div>
            <Button variant="outline" onClick={onClose}>
              Close Preview
            </Button>
          </div>

          {document.placeholders && document.placeholders.length > 0 && (
            <div className="w-full mt-4 p-3 bg-muted rounded-md">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium">Placeholders Used</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {document.placeholders.map((placeholder) => (
                  <div
                    key={placeholder}
                    className="text-xs bg-green-100 border border-green-300 text-green-800 px-2 py-1 rounded"
                  >
                    {placeholder}: {document.data[placeholder] || ""}
                  </div>
                ))}
              </div>
            </div>
          )}

          {document.csvHeaders && document.csvHeaders.length > 0 && (
            <div className="w-full mt-2 p-3 bg-muted rounded-md">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium">CSV Headers</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {document.csvHeaders.map((header) => (
                  <div
                    key={header}
                    className={`text-xs px-2 py-1 rounded border ${
                      document.placeholders?.includes(header)
                        ? "bg-green-100 border-green-300 text-green-800"
                        : "bg-background border-gray-200"
                    }`}
                  >
                    {header}
                    {document.placeholders?.includes(header) && (
                      <span className="ml-1 text-green-600">✓</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardFooter>
      </Card>
    );
  }

  // Default Template Preview
  const templateId = document.templateId || "invoice";

  // For custom templates, create a simple HTML representation based on the document data
  let documentContent = "";

  if (templateId === "custom") {
    // Create a dynamic HTML representation based on the document data
    documentContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${document.title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; line-height: 1.6; }
          .document { max-width: 800px; margin: 0 auto; }
          .field { margin-bottom: 10px; }
          .field-name { font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="document">
          <h2>${document.title}</h2>
          ${Object.entries(document.data)
            .map(
              ([key, value]) => `
              <div class="field">
                <span class="field-name">${key
                  .split("_")
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" ")}:</span> 
                <span class="field-value">${value}</span>
              </div>
            `
            )
            .join("")}
        </div>
      </body>
      </html>
    `;
  } else {
    // For default templates, use the template processor
    const templateContent = getDefaultTemplate(templateId);
    documentContent = templateContent
      ? processTemplate(templateContent, document.data)
      : "";
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>{document.title}</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={isDownloading}
          >
            <Download className="h-4 w-4 mr-2" />
            {isDownloading ? "Downloading..." : "Download HTML"}
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md p-4 bg-white overflow-auto max-h-[70vh]">
          <iframe
            srcDoc={documentContent}
            title={document.title}
            className="w-full min-h-[500px] border-0"
            sandbox="allow-same-origin"
          />
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-start space-y-4">
        <div className="w-full flex justify-between">
          <div className="text-sm text-muted-foreground">
            {document.originalFormat && (
              <span className="px-2 py-1 bg-muted rounded-full text-xs mr-2">
                {document.originalFormat.toUpperCase()}
              </span>
            )}
            Using default template formatting
          </div>
          <Button variant="outline" onClick={onClose}>
            Close Preview
          </Button>
        </div>

        {document.placeholders && document.placeholders.length > 0 && (
          <div className="w-full mt-4 p-3 bg-muted rounded-md">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium">Placeholders Used</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {document.placeholders.map((placeholder) => (
                <div
                  key={placeholder}
                  className="text-xs bg-green-100 border border-green-300 text-green-800 px-2 py-1 rounded"
                >
                  {placeholder}: {document.data[placeholder] || ""}
                </div>
              ))}
            </div>
          </div>
        )}

        {document.csvHeaders && document.csvHeaders.length > 0 && (
          <div className="w-full mt-2 p-3 bg-muted rounded-md">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium">CSV Headers</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {document.csvHeaders.map((header) => (
                <div
                  key={header}
                  className={`text-xs px-2 py-1 rounded border ${
                    document.placeholders?.includes(header)
                      ? "bg-green-100 border-green-300 text-green-800"
                      : "bg-background border-gray-200"
                  }`}
                >
                  {header}
                  {document.placeholders?.includes(header) && (
                    <span className="ml-1 text-green-600">✓</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
