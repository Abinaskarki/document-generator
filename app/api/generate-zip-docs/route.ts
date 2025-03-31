import { NextRequest, NextResponse } from "next/server";
import { ref, getDownloadURL } from "firebase/storage";
import archiver from "archiver";
import { PassThrough } from "stream";
import { storage } from "@/lib/firebase";

export async function POST(request: NextRequest) {
  try {
    // Parse the request body to get the batchId
    const { batchId } = await request.json();

    if (!batchId) {
      return NextResponse.json(
        { error: "Batch ID is required" },
        { status: 400 }
      );
    }

    // Fetch the PDF download URL from Firebase
    const pdfRef = ref(storage, `pdf/${batchId}/generated-document.pdf`);
    const pdfDownloadUrl = await getDownloadURL(pdfRef);

    // Fetch the PDF file as a Buffer
    const pdfResponse = await fetch(pdfDownloadUrl);
    if (!pdfResponse.ok) {
      throw new Error("Failed to fetch the PDF file from Firebase");
    }
    const pdfBuffer = await pdfResponse.arrayBuffer();

    // Create a zip file containing the PDF
    const archive = archiver("zip", { zlib: { level: 9 } });

    // Use PassThrough to pipe the archive to the response
    const passThrough = new PassThrough();

    // Pipe the archive to the PassThrough stream
    archive.pipe(passThrough);

    // Append the PDF buffer to the zip file
    archive.append(Buffer.from(pdfBuffer), { name: "generated-document.pdf" });

    // Finalize the archive
    archive.finalize();

    // Return the PassThrough stream as the response
    return new NextResponse(passThrough, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename=batch-${batchId}.zip`,
      },
    });
  } catch (error) {
    console.error("Error generating zip file:", error);
    return NextResponse.json(
      { error: "Failed to generate zip file" },
      { status: 500 }
    );
  }
}
