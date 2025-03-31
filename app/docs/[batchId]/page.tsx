"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function DocumentBatchPage({
  params,
}: {
  params: { batchId: string };
}) {
  const [batchInfo, setBatchInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [emailDetails, setEmailDetails] = useState({
    recipient: "",
    subject: "",
    body: "",
  });

  async function fetchBatchFromAPI(batchId: string) {
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
      const { batchId } = await params;
      const batch = await fetchBatchFromAPI(batchId);
      console.log(batch);
      if (batch) {
        setBatchInfo(batch);
      }
      setLoading(false);
    };

    fetchBatchInfo();
  }, [params]);

  const downloadZippedPDF = async (batchId: string) => {
    try {
      const response = await fetch("/api/generate-zip-docs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ batchId }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate zip file");
      }

      // Create a blob from the response
      const blob = await response.blob();

      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `batch-${batchId}.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      alert("Zipped PDF downloaded successfully!");
    } catch (error) {
      console.error("Error downloading zipped PDF:", error);
      alert("Failed to download zipped PDF. Please try again.");
    }
  };

  const sendEmail = async () => {
    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          batchId: batchInfo.id,
          recipient: emailDetails.recipient,
          subject: emailDetails.subject,
          body: emailDetails.body,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send email");
      }

      alert("Email sent successfully!");
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error sending email:", error);
      alert("Failed to send email. Please try again.");
    }
  };

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
          <p className="text-gray-600">Batch ID: {batchInfo.id}</p>
          <p className="text-gray-600">
            Document Count: {batchInfo.documentCount}
          </p>
        </div>
        <Link href="/">
          <Button variant="outline">Create New Batch</Button>
        </Link>
      </div>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Document Batch</CardTitle>
          <CardDescription>
            Your documents have been generated. You can view or download the
            files below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button variant="outline" asChild>
              <a
                href={batchInfo.pdfDownloadUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                View PDF
              </a>
            </Button>
            <Button
              variant="outline"
              onClick={() => downloadZippedPDF(batchInfo.id)}
            >
              Download Zipped PDF
            </Button>
            <Button variant="outline" onClick={() => setIsModalOpen(true)}>
              Send Zipped PDF via Email
            </Button>
          </div>
        </CardContent>
      </Card>
      <div className="w-full h-[80vh] border border-gray-300 rounded-lg overflow-hidden">
        {batchInfo.pdf.downloadUrl ? (
          <iframe
            src={`${batchInfo.pdf.downloadUrl}`}
            type="application/pdf"
            width="100%"
            height="100%"
            title="PDF Viewer"
          />
        ) : (
          <p className="text-center text-gray-500">
            No PDF available for this batch.
          </p>
        )}
      </div>

      {/* Email Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-bold mb-4">
              Send Zipped PDF via Email
            </h2>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Recipient Email
              </label>
              <input
                type="email"
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={emailDetails.recipient}
                onChange={(e) =>
                  setEmailDetails({
                    ...emailDetails,
                    recipient: e.target.value,
                  })
                }
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Subject</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={emailDetails.subject}
                onChange={(e) =>
                  setEmailDetails({ ...emailDetails, subject: e.target.value })
                }
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Body</label>
              <textarea
                className="w-full border border-gray-300 rounded px-3 py-2"
                rows={4}
                value={emailDetails.body}
                onChange={(e) =>
                  setEmailDetails({ ...emailDetails, body: e.target.value })
                }
              />
            </div>
            <p className="text-sm text-gray-500 mb-4">
              The zipped PDF will be attached to the email.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={sendEmail}>Send</Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
