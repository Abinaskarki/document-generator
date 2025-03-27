"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import DocumentList from "@/components/document-list";
import Link from "next/link";
import { useDocuments } from "@/lib/document-context";
import { useEffect, useState } from "react";

export default function DocumentBatchPage({
  params,
}: {
  params: { batchId: string };
}) {
  const { getBatchById } = useDocuments();
  const [batchInfo, setBatchInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchBatchFromFirebase(batchId: string) {
    try {
      const response = await fetch(`/api/documents/${batchId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch batch with ID ${batchId}`);
      }
      return response.json();
    } catch (error) {
      console.error("Error fetching batch from API:", error);
      setError("Failed to fetch batch information. Please try again.");
      return null;
    }
  }

  useEffect(() => {
    const fetchBatchInfo = async () => {
      setLoading(true);
      setError(null);

      // First, try to get batch info from context
      let batch = getBatchById(params.batchId);

      // If not found in context, fetch from API
      if (!batch) {
        batch = await fetchBatchFromFirebase(params.batchId);
      }

      setBatchInfo(batch);
      setLoading(false);
    };

    fetchBatchInfo();
  }, [params.batchId, getBatchById]);

  if (loading) {
    return (
      <main className="container mx-auto py-10 px-4">
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-500">Loading batch information...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="container mx-auto py-10 px-4">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Link href="/">
            <Button>Return to Home</Button>
          </Link>
        </div>
      </main>
    );
  }

  if (!batchInfo) {
    return (
      <main className="container mx-auto py-10 px-4">
        <div className="text-center">
          <p className="text-gray-500 mb-4">No batch information found.</p>
          <Link href="/">
            <Button>Create New Batch</Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto py-10 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Generated Documents</h1>
          <p className="text-gray-600">Template: {batchInfo.title}</p>
        </div>
        <Link href="/">
          <Button variant="outline">Create New Batch</Button>
        </Link>
      </div>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Document Batch</CardTitle>
          <CardDescription>
            Your documents have been generated. You can preview, edit, and
            download them individually or as a batch.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button asChild>
              <a
                href={batchInfo.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Download All (PDF)
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a
                href={batchInfo.zipUrl}
                download={`batch-${params.batchId}.zip`}
              >
                Download All (ZIP)
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
      <DocumentList batchId={params.batchId} />
    </main>
  );
}
