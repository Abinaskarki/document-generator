"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { FileUploader } from "./file-uploader"
import { useRouter } from "next/navigation"
import { FileSpreadsheet, Download, Info } from "lucide-react"
import { getDefaultCSV } from "@/lib/default-templates"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useDocuments } from "@/lib/document-context"

const DEFAULT_TEMPLATES = [
  {
    id: "invoice",
    name: "Invoice Template",
    description:
      "A simple invoice template with invoice number, customer name, item description, amount, and due date.",
    preview: "/placeholder.svg?height=200&width=300",
    fields: ["invoice_number", "customer_name", "item_description", "amount", "due_date"],
  },
  {
    id: "receipt",
    name: "Receipt Template",
    description: "A receipt template with receipt number, customer name, item name, amount, and date.",
    preview: "/placeholder.svg?height=200&width=300",
    fields: ["receipt_number", "customer_name", "item_name", "amount", "date"],
  },
  {
    id: "contract",
    name: "Contract Template",
    description: "A basic contract template with party names, contract purpose, start date, and end date.",
    preview: "/placeholder.svg?height=200&width=300",
    fields: ["party1_name", "party2_name", "contract_purpose", "start_date", "end_date"],
  },
]

export default function DefaultTemplates() {
  const router = useRouter()
  const { addBatch } = useDocuments()
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedTemplate || !csvFile) {
      setError("Both template and CSV file are required")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("templateId", selectedTemplate)
      formData.append("csv", csvFile)

      const response = await fetch("/api/generate-from-default", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        console.error("Server response:", data)

        // Display detailed error information
        if (data.details) {
          if (typeof data.details === "object") {
            // For structured error details
            const errorDetails = data.details
            let errorMessage = `${data.error}. `

            if (errorDetails.message) {
              errorMessage += errorDetails.message
            }

            if (errorDetails.missingFields) {
              errorMessage += `\n\nMissing fields: ${errorDetails.missingFields.join(", ")}`
              errorMessage += `\n\nRequired fields: ${errorDetails.requiredFields.join(", ")}`
              errorMessage += `\n\nYour CSV has: ${errorDetails.csvHeaders.join(", ")}`
            }

            throw new Error(errorMessage)
          } else {
            // For string error details
            throw new Error(`${data.error}: ${data.details}`)
          }
        } else {
          throw new Error(data.error || response.statusText)
        }
      }

      // Store the batch information in context
      addBatch({
        batchId: data.batchId,
        templateId: data.templateId,
        documentCount: data.documentCount,
      })

      router.push(`/documents/${data.batchId}`)
    } catch (error) {
      console.error("Error generating documents:", error)
      setError(error instanceof Error ? error.message : "Failed to generate documents")
    } finally {
      setIsLoading(false)
    }
  }

  const downloadSampleCSV = (templateId: string) => {
    const csvContent = getDefaultCSV(templateId)
    if (!csvContent) return

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `sample_${templateId}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleUseSampleCSV = (templateId: string) => {
    const csvContent = getDefaultCSV(templateId)
    if (!csvContent) return

    const blob = new Blob([csvContent], { type: "text/csv" })
    const file = new File([blob], `sample_${templateId}.csv`, { type: "text/csv" })
    setCsvFile(file)
  }

  const selectedTemplateInfo = selectedTemplate ? DEFAULT_TEMPLATES.find((t) => t.id === selectedTemplate) : null

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {DEFAULT_TEMPLATES.map((template) => (
          <Card
            key={template.id}
            className={`cursor-pointer transition-all ${selectedTemplate === template.id ? "ring-2 ring-primary" : ""}`}
            onClick={() => setSelectedTemplate(template.id)}
          >
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-lg">{template.name}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-sm text-gray-500 mb-4">{template.description}</p>
              <div className="aspect-[3/2] bg-gray-100 rounded-md flex items-center justify-center">
                <img
                  src={template.preview || "/placeholder.svg"}
                  alt={template.name}
                  className="max-h-full object-cover rounded-md"
                />
              </div>
            </CardContent>
            <CardFooter className="p-4 pt-0">
              <Button
                variant={selectedTemplate === template.id ? "default" : "outline"}
                className="w-full"
                onClick={() => setSelectedTemplate(template.id)}
              >
                {selectedTemplate === template.id ? "Selected" : "Select Template"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {selectedTemplate && (
        <div className="bg-muted p-4 rounded-md">
          <div className="flex items-center gap-2 mb-2">
            <Info className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-medium">Required Fields</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-2">
            This template requires the following fields in your CSV file:
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {selectedTemplateInfo?.fields.map((field) => (
              <div key={field} className="bg-background text-sm px-2 py-1 rounded border">
                {field}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadSampleCSV(selectedTemplate)}
              className="flex items-center gap-1"
            >
              <Download className="h-4 w-4" />
              Download Sample CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleUseSampleCSV(selectedTemplate)}
              className="flex items-center gap-1"
            >
              Use Sample Data
            </Button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <FileSpreadsheet className="h-5 w-5 text-gray-500" />
            <h3 className="font-medium">Upload CSV Data</h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
                    <Info className="h-4 w-4" />
                    <span className="sr-only">CSV Format Info</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Your CSV file should have headers matching the required fields. Each row will generate a separate
                    document.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <FileUploader
            id="csv-default"
            accept=".csv"
            onChange={setCsvFile}
            value={csvFile}
            placeholder="Upload CSV file with your data"
          />
          <p className="text-sm text-gray-500">
            Your CSV should have headers that match the required fields for the template.
          </p>
        </div>

        <Button type="submit" className="w-full" disabled={!selectedTemplate || !csvFile || isLoading}>
          {isLoading ? "Processing..." : "Generate Documents"}
        </Button>
      </form>
    </div>
  )
}

