"use client"

import type React from "react"

import { type ChangeEvent, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Upload, X } from "lucide-react"

interface FileUploaderProps {
  id: string
  accept: string
  onChange: (file: File | null) => void
  value: File | null
  placeholder: string
}

export function FileUploader({ id, accept, onChange, value, placeholder }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    onChange(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0] || null
    if (file && accept.includes(file.name.split(".").pop() || "")) {
      onChange(file)
    }
  }

  const clearFile = () => {
    onChange(null)
  }

  return (
    <div
      className={`border-2 border-dashed rounded-md p-4 ${
        isDragging ? "border-primary bg-primary/5" : "border-gray-300"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Input id={id} type="file" accept={accept} onChange={handleFileChange} className="hidden" />

      {value ? (
        <div className="flex items-center justify-between">
          <span className="text-sm truncate max-w-[80%]">{value.name}</span>
          <Button type="button" variant="ghost" size="sm" onClick={clearFile} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
            <span className="sr-only">Remove file</span>
          </Button>
        </div>
      ) : (
        <label htmlFor={id} className="flex flex-col items-center justify-center cursor-pointer py-4">
          <Upload className="h-8 w-8 text-gray-400 mb-2" />
          <span className="text-sm text-gray-500">{placeholder}</span>
          <span className="text-xs text-gray-400 mt-1">Drag and drop or click to browse</span>
        </label>
      )}
    </div>
  )
}

