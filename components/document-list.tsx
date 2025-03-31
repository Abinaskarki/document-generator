"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { getStorage, ref, getDownloadURL } from "firebase/storage";

interface DocumentListProps {
  batchId: string;
  documentId: string; // Add documentId to props
}

export default function DocumentList({ batchId }: DocumentListProps) {
  const [documentData, setDocumentData] = useState<any | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocument = async () => {
      setLoading(true);
      setError(null);

      try {
        // Initialize Firestore
        const db = getFirestore();
        const docRef = doc(db, "batches", batchId, "documents", documentId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          throw new Error("Document not found");
        }

        // Set the document data
        setDocumentData(docSnap.data());

        // Fetch the PDF URL from Firebase Storage
        const storage = getStorage();
        const pdfRef = ref(storage, `pdf/${batchId}/${documentId}.pdf`);
        const url = await getDownloadURL(pdfRef);
        setPdfUrl(url);
      } catch (err) {
        console.error("Error fetching document:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch document"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [batchId, documentId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-500">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error loading document</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
        <div className="mt-4">
          <Link href="/">
            <Button>Return to Home</Button>
          </Link>
        </div>
      </Alert>
    );
  }

  if (!documentData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">No document found for this ID.</p>
        <Link href="/">
          <Button>Create New Document</Button>
        </Link>
      </div>
    );
  }

  if (!pdfUrl) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">No PDF available for this document.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-10">
      <h2 className="text-2xl font-bold mb-4">Generated PDF</h2>
      <p className="text-gray-600 mb-6">
        The generated PDF for document <strong>{documentId}</strong> is
        available below.
      </p>
      <div className="flex flex-col items-center gap-4">
        <Button asChild>
          <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
            View PDF
          </a>
        </Button>
        <Button variant="outline" asChild>
          <a href={pdfUrl} download={`document-${documentId}.pdf`}>
            Download PDF
          </a>
        </Button>
      </div>
    </div>
  );
}
