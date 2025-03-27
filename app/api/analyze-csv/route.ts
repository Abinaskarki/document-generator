import { type NextRequest, NextResponse } from "next/server"
import { parseCSV } from "@/lib/document-processor"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const csvFile = formData.get("csv") as File

    if (!csvFile) {
      return NextResponse.json(
        {
          error: "CSV file is required",
          details: "Please upload a CSV file to analyze",
        },
        { status: 400 },
      )
    }

    // Validate file type
    if (csvFile.type !== "text/csv" && !csvFile.name.endsWith(".csv")) {
      return NextResponse.json(
        {
          error: "Invalid file format",
          details: "File must be a valid CSV file",
        },
        { status: 400 },
      )
    }

    // Read the CSV file
    const csvBuffer = await csvFile.arrayBuffer()
    const csvContent = new TextDecoder().decode(csvBuffer)

    try {
      // Parse the CSV to get the headers
      const csvData = await parseCSV(csvContent)

      if (!csvData || csvData.length === 0) {
        return NextResponse.json(
          {
            error: "CSV file is empty or invalid",
            details: "Your CSV file must contain at least one row of data with headers",
          },
          { status: 400 },
        )
      }

      // Extract headers from the first row
      const headers = Object.keys(csvData[0])

      if (headers.length === 0) {
        return NextResponse.json(
          {
            error: "No headers found in CSV file",
            details: "Your CSV file must have column headers in the first row",
          },
          { status: 400 },
        )
      }

      // Check for empty rows
      const emptyRows = csvData.filter((row) =>
        Object.values(row).every((value) => !value || value.trim() === ""),
      ).length

      return NextResponse.json({
        headers,
        rowCount: csvData.length,
        emptyRows,
        success: true,
      })
    } catch (csvError) {
      console.error("CSV parsing error:", csvError)
      return NextResponse.json(
        {
          error: "Failed to parse CSV file",
          details: csvError instanceof Error ? csvError.message : "Invalid CSV format",
        },
        { status: 400 },
      )
    }
  } catch (error) {
    console.error("Error analyzing CSV:", error)
    return NextResponse.json(
      {
        error: "Failed to analyze CSV",
        details: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    )
  }
}

