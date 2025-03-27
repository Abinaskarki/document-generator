"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileText, Download, Edit, Eye, AlertTriangle } from "lucide-react";
import DocumentPreview from "./document-preview";
import DocumentEditor from "./document-editor";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import db from "@/lib/in-memory-db";

interface DocumentListProps {
  batchId: string;
}

export default function DocumentList({ batchId }: DocumentListProps) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDocument, setActiveDocument] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Fetch documents from the in-memory database or API
  useEffect(() => {
    const fetchDocuments = async () => {
      console.log(`Fetching documents for batch ${batchId}`);
      setLoading(true);
      setError(null);

      try {
        // Initialize the database
        await db.init();

        // Try to get documents from the in-memory database
        const docs = db.getDocumentsByBatchId(batchId);

        // If no documents found in the database, fetch from API
        if (docs.length === 0) {
          const response = await fetch(`/api/documents/${batchId}`);
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "Failed to fetch documents");
          }

          // Store the fetched documents in our state
          setDocuments(data.documents || []);
        } else {
          // Use documents from the in-memory database
          setDocuments(docs);
        }
      } catch (err) {
        console.error("Error fetching documents:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch documents"
        );
        setDocuments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [batchId]);

  const handleEdit = (documentId: string) => {
    setActiveDocument(documentId);
    setIsEditing(true);
  };

  const handlePreview = (documentId: string) => {
    setActiveDocument(documentId);
    setIsEditing(false);
  };

  const handleClosePreview = () => {
    setActiveDocument(null);
  };

  const handleSaveEdit = async (
    documentId: string,
    updatedData: Record<string, string>
  ) => {
    try {
      // Update the document in the in-memory database
      await db.init();
      const updatedDoc = db.updateDocument(documentId, { data: updatedData });

      // If not in the database, update via API
      if (!updatedDoc) {
        const response = await fetch(`/api/documents/${batchId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            documentId,
            data: updatedData,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to update document");
        }
      }

      // Update local state
      setDocuments(
        documents.map((doc) => {
          if (doc.id === documentId) {
            return { ...doc, data: updatedData };
          }
          return doc;
        })
      );

      // Update the active document state
      setActiveDocument((prev) =>
        prev ? { ...prev, data: updatedData } : null
      );
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving document:", error);
      // You could show an error message here
    }
  };

  const activeDoc = documents.find((doc) => doc.id === activeDocument);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-500">Loading documents...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error loading documents</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
        <div className="mt-4">
          <Link href="/">
            <Button>Return to Home</Button>
          </Link>
        </div>
      </Alert>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">No documents found for this batch.</p>
        <Link href="/">
          <Button>Create New Documents</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {activeDocument && activeDoc ? (
        isEditing ? (
          <DocumentEditor
            document={activeDoc}
            onSave={handleSaveEdit}
            onCancel={handleClosePreview}
          />
        ) : (
          <DocumentPreview
            document={activeDoc}
            onClose={handleClosePreview}
            onEdit={() => {
              setIsEditing(true);
              setActiveDocument(activeDoc); // Update the active document state after editing
            }}
          />
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <Card key={doc.id}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {doc.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">
                  {doc.preview || "Preview not available"}
                </p>
                {doc.originalFormat && (
                  <div className="mt-2">
                    <span className="text-xs px-2 py-1 bg-muted rounded-full">
                      {doc.originalFormat.toUpperCase()}
                    </span>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePreview(doc.id)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(doc.id)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  PDF
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
