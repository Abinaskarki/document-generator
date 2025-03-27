"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, Upload, Trash2, Database } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import db from "@/lib/in-memory-db"

export default function DbControls() {
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const handleExport = () => {
    try {
      const data = db.exportData()
      const blob = new Blob([data], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `document-generator-export-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setMessage({ type: "success", text: "Data exported successfully" })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error("Error exporting data:", error)
      setMessage({ type: "error", text: "Failed to export data" })
    }
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const jsonData = event.target?.result as string
        const success = db.importData(jsonData)

        if (success) {
          setMessage({ type: "success", text: "Data imported successfully. Refresh the page to see changes." })
          setTimeout(() => window.location.reload(), 2000)
        } else {
          setMessage({ type: "error", text: "Invalid data format" })
        }
      } catch (error) {
        console.error("Error importing data:", error)
        setMessage({ type: "error", text: "Failed to import data" })
      }
    }
    reader.readAsText(file)

    // Reset the input
    e.target.value = ""
  }

  const handleClearData = () => {
    if (confirm("Are you sure you want to clear all data? This cannot be undone.")) {
      db.clearAll()
      setMessage({ type: "success", text: "All data cleared. Refresh the page to see changes." })
      setTimeout(() => window.location.reload(), 2000)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Controls
        </CardTitle>
      </CardHeader>
      <CardContent>
        {message && (
          <Alert variant={message.type === "success" ? "default" : "destructive"} className="mb-4">
            <AlertTitle>{message.type === "success" ? "Success" : "Error"}</AlertTitle>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col space-y-3">
          <Button variant="outline" onClick={handleExport} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Data
          </Button>

          <div className="relative">
            <Button variant="outline" className="w-full flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Import Data
            </Button>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>

          <Button variant="destructive" onClick={handleClearData} className="flex items-center gap-2">
            <Trash2 className="h-4 w-4" />
            Clear All Data
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

