import { type NextRequest, NextResponse } from "next/server";
import db from "@/lib/in-memory-db";

export async function GET(
  request: NextRequest,
  { params }: { params: { batchId: string } }
) {
  try {
    const resolvedParams = await params;
    const batchId = resolvedParams.batchId;

    if (!batchId) {
      return NextResponse.json(
        {
          error: "Batch ID is required",
          details: "Please provide a valid batch ID",
        },
        { status: 400 }
      );
    }

    // Initialize the database if needed
    await db.init();

    // Get batch information
    const batch = db.getBatchById(batchId);

    // Get documents for this batch
    const documents = db.getDocumentsByBatchId(batchId);

    if (!batch && documents.length === 0) {
      return NextResponse.json(
        {
          error: "Batch not found",
          details: `No data found for batch ID ${batchId}`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      batchId,
      batch,
      documents,
      success: true,
    });
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch documents",
        details:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { batchId: string } }
) {
  try {
    const resolvedParams = await params;
    const batchId = resolvedParams.batchId;
    const body = await request.json();

    if (!batchId) {
      return NextResponse.json(
        {
          error: "Batch ID is required",
          details: "Please provide a valid batch ID",
        },
        { status: 400 }
      );
    }

    // Initialize the database if needed
    await db.init();

    // Update document
    if (body.documentId && body.data) {
      const updatedDoc = db.updateDocument(body.documentId, {
        data: body.data,
      });

      if (!updatedDoc) {
        return NextResponse.json(
          {
            error: "Document not found",
            details: `Document with ID ${body.documentId} not found`,
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        document: updatedDoc,
      });
    }

    return NextResponse.json(
      {
        error: "Invalid request",
        details: "Request must include documentId and data",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error updating document:", error);
    return NextResponse.json(
      {
        error: "Failed to update document",
        details:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
