"use client";

import { useState } from "react";
import { useDocuments } from "@/lib/document-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, X } from "lucide-react";

interface DocumentEditorProps {
  document: {
    id: string;
    title: string;
    data: Record<string, string>;
    placeholders?: string[];
    csvHeaders?: string[];
  };
  onSave?: () => void;
  onCancel: () => void;
}

export default function DocumentEditor({
  document,
  onSave,
  onCancel,
}: DocumentEditorProps) {
  const { updateDocument } = useDocuments();
  const [editedDocument, setEditedDocument] = useState(document);
  const [formData, setFormData] = useState<Record<string, string>>(
    document.data
  );

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateDocument(editedDocument);
    onSave?.();
  };

  // Update the document editor to show all available fields from the CSV
  // Modify the fieldsToEdit logic to include all CSV headers

  // Determine which fields to show in the editor
  // If placeholders are provided, prioritize those
  // Otherwise, show all fields in the data
  const fieldsToEdit = document.placeholders || Object.keys(document.data);

  // Add a section to show CSV headers that aren't being used
  const unusedCsvHeaders = document.csvHeaders
    ? document.csvHeaders.filter((header) => !fieldsToEdit.includes(header))
    : [];

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Edit {document.title}</CardTitle>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fieldsToEdit.map((key) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={key}>
                  {key
                    .split("_")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ")}
                </Label>
                <Input
                  id={key}
                  value={formData[key] || ""}
                  onChange={(e) => handleChange(key, e.target.value)}
                />
              </div>
            ))}
          </div>
        </form>
        {unusedCsvHeaders.length > 0 && (
          <div className="mt-4 p-3 bg-muted rounded-md">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium">
                Additional CSV Fields (Not Used)
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {unusedCsvHeaders.map((header) => (
                <div
                  key={header}
                  className="text-xs bg-background px-2 py-1 rounded border"
                >
                  {header}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              These fields are in your CSV but don't match any placeholders in
              your template.
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSubmit}>
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </CardFooter>
    </Card>
  );
}
