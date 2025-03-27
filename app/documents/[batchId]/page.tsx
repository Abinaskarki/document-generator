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
  const [resolvedParams, setResolvedParams] = useState<{
    batchId: string;
  } | null>(null);

  useEffect(() => {
    const fetchParams = async () => {
      const resolved = await params;
      setResolvedParams(resolved);
    };
    fetchParams();
  }, [params]);

  useEffect(() => {
    if (resolvedParams) {
      const fetchBatchInfo = async () => {
        // Get batch information from context
        const batch = getBatchById(resolvedParams.batchId);
        if (batch) {
          setBatchInfo(batch);
        } else {
          // If not in context, we could fetch from API here
          // For now, extract template type from batch ID (format: templateId-uuid)
          const templateType = resolvedParams.batchId.split("-")[0] || "custom";

          // Format template name for display
          const templateName =
            templateType === "custom"
              ? "Custom Template"
              : `${
                  templateType.charAt(0).toUpperCase() + templateType.slice(1)
                } Template`;

          setBatchInfo({
            batchId: resolvedParams.batchId,
            templateId: templateType,
            title: templateName,
          });
        }
      };
      fetchBatchInfo();
    }
  }, [resolvedParams, getBatchById]);

  if (!batchInfo) {
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
            <Button>Download All (PDF)</Button>
            <Button variant="outline">Download All (ZIP)</Button>
          </div>
        </CardContent>
      </Card>

      {resolvedParams && <DocumentList batchId={resolvedParams.batchId} />}
    </main>
  );
}
