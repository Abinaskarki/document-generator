"use client";

import { useState } from "react";
import TemplateStep from "./steps/TemplateStep";
import DataStep from "./steps/DataStep";
import PreviewStep from "./steps/PreviewStep";
import DocumentBatchPage from "./DocumentsBatchPage"; // Import the DocumentBatchPage component
import { useRouter } from "next/navigation";

export default function UploadStepsForm() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [templatePreview, setTemplatePreview] = useState<string | null>(null);
  const [placeholders, setPlaceholders] = useState<string[]>([]);
  const [dataFile, setDataFile] = useState<File | null>(null);
  const [dataPreview, setDataPreview] = useState<any[]>([]);
  const [editedData, setEditedData] = useState<any[]>([]);
  const [dataHeaders, setDataHeaders] = useState<string[]>([]);
  const [templateHtml, setTemplateHtml] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [batchId, setBatchId] = useState<string | null>(null); // State to store the batch ID

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!templateFile || !editedData || editedData.length === 0) {
      setError("Both template and valid data are required.");
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
        const { value: htmlContent } = await import("mammoth").then((m) =>
          m.convertToHtml({ arrayBuffer })
        );
        convertedHtml = htmlContent;
      } else {
        // If the file is not DOCX, read it as plain text
        const textContent = await templateFile.text();
        convertedHtml = textContent;
      }

      // Prepare the JSON payload
      const payload = {
        templateHtml: convertedHtml,
        data: editedData,
      };

      // Send the JSON payload to the API
      const response = await fetch("/api/generate-docs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate documents.");
      }

      const data = await response.json();
      setBatchId(data.batchId); // Store the batch ID
      setCurrentStep(4); // Move to the DocumentBatchPage step

      console.log("Documents generated successfully:", data);
      alert("Documents generated successfully!");
    } catch (error) {
      console.error("Error generating documents:", error);
      setError(
        error instanceof Error ? error.message : "Failed to generate documents."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {currentStep === 1 && (
        <TemplateStep
          templateFile={templateFile}
          setTemplateFile={setTemplateFile}
          templateHtml={templateHtml}
          setTemplateHtml={setTemplateHtml}
          templatePreview={templatePreview}
          setTemplatePreview={setTemplatePreview}
          placeholders={placeholders}
          setPlaceholders={setPlaceholders}
          onNext={() => setCurrentStep(2)}
        />
      )}
      {currentStep === 2 && (
        <DataStep
          dataFile={dataFile}
          setDataFile={setDataFile}
          dataPreview={dataPreview}
          setDataPreview={setDataPreview}
          dataHeaders={dataHeaders}
          setDataHeaders={setDataHeaders}
          placeholders={placeholders}
          onNext={() => setCurrentStep(3)}
          onPrevious={() => setCurrentStep(1)}
          editedData={editedData} // Pass editedData to DataStep
          setEditedData={setEditedData} // Pass editedData to parent
        />
      )}
      {currentStep === 3 && (
        <PreviewStep
          templatePreview={templatePreview}
          dataPreview={dataPreview}
          placeholders={placeholders}
          onPrevious={() => setCurrentStep(2)}
          onSubmit={handleSubmit} // Pass handleSubmit to PreviewStep
        />
      )}
      {currentStep === 4 && batchId && (
        <DocumentBatchPage params={{ batchId }} /> // Render DocumentBatchPage with the batch ID
      )}

      {/* Progress Bar */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96 text-center">
            <div className="relative w-full h-2 bg-gray-200 rounded">
              <div className="absolute top-0 left-0 h-2 bg-primary rounded animate-pulse w-3/4"></div>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Generating documents...
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && <p className="text-red-500 mt-4">{error}</p>}
    </div>
  );
}
