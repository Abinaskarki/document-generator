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
import dynamic from "next/dynamic";
// import { pdfjs } from "react-pdf";

// import { Document, Page } from "react-pdf";

import { useEffect, useState } from "react";

import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";

// pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@2.16.105/build/pdf.worker.min.js`;

// const Document = dynamic(
//   () => import("react-pdf").then((mod) => mod.Document),
//   {
//     ssr: false,
//   }
// );
// const Page = dynamic(() => import("react-pdf").then((mod) => mod.Page), {
//   ssr: false,
// });

// const Viewer = dynamic(
//   () => import("@react-pdf-viewer/core").then((mod) => mod.Viewer),
//   { ssr: false }
// );
// const Worker = dynamic(
//   () => import("@react-pdf-viewer/core").then((mod) => mod.Worker),
//   { ssr: false }
// );
// const defaultLayoutPlugin = dynamic(
//   () =>
//     import("@react-pdf-viewer/default-layout").then(
//       (mod) => mod.defaultLayoutPlugin
//     ),
//   { ssr: false }
// );
export default function DocumentBatchPage2({
  params,
}: {
  params: { batchId: string };
}) {
  const [batchInfo, setBatchInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  // const getCorrectDownloadUrl = async () => {
  //   try {
  //     const fileRef = ref(
  //       storage,
  //       "pdf/custom-2be23434-0f27-4995-a93c-b7885d3df330/generated-document.pdf"
  //     );
  //     const url = await getDownloadURL(fileRef);
  //     setDownloadUrl(url);
  //   } catch (error) {
  //     console.error("Error getting correct URL", error);
  //   }
  // };

  // const defaultLayoutPluginInstance = defaultLayoutPlugin();

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
      const { batchId } = await params;
      const batch = await fetchBatchFromFirebase(batchId);

      console.log(batch);

      setBatchInfo(batch);
      setLoading(false);
    };

    fetchBatchInfo();
  }, [params]);

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
                href={batchInfo.template.publicUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                View Template
              </a>
            </Button>
            {/* <Button variant="outline" asChild>
              <a
                href={batchInfo.template.downloadUrl}
                download={`template-${params.batchId}.html`}
              >
                Download Template
              </a>
            </Button> */}
            <Button variant="outline" asChild>
              <a
                href={batchInfo.csv.publicUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                View CSV
              </a>
            </Button>
            {/* <Button variant="outline" asChild>
              <a
                href={batchInfo.csv.downloadUrl}
                download={`data-${params.batchId}.csv`}
              >
                Download CSV
              </a>
            </Button> */}
            <Button variant="outline" asChild>
              <a
                href={batchInfo.pdf.publicUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                View PDF
              </a>
            </Button>
            {/* <Button variant="outline" asChild>
              <a
                href={batchInfo.pdf.downloadUrl}
                download={`batch-${params.batchId}.pdf`}
              >
                Download PDF
              </a>
            </Button> */}
          </div>
        </CardContent>
      </Card>
      <div className="w-full h-[80vh] border border-gray-300 rounded-lg overflow-hidden">
        {/* <Worker
          workerUrl={`https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js`}
        >
          <Viewer
            fileUrl={batchInfo.pdf.downloadUrl}
            plugins={[defaultLayoutPluginInstance]}
          />
        </Worker> */}

        <div className="w-full h-[80vh] border border-gray-300 rounded-lg overflow-hidden">
          {batchInfo.pdf.downloadUrl ? (
            <iframe
              type="application/pdf"
              width="100%"
              height="100%"
              src={batchInfo.pdf.downloadUrl}
              title="PDF Viewer"
            />
          ) : (
            <p className="text-center text-gray-500">
              No PDF available for this batch.
            </p>
          )}
        </div>
        {/* <Document file={"/public/generated-document.pdf"}>
          <Page pageNumber={1} />
        </Document> */}
      </div>
    </main>
  );
}
