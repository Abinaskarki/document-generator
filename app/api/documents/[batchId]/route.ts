import { type NextRequest, NextResponse } from "next/server";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function GET(
  request: NextRequest,
  { params }: { params: { batchId: string } }
) {
  try {
    const { batchId } = await params;

    if (!batchId) {
      return NextResponse.json(
        {
          error: "Batch ID is required",
          details: "Please provide a valid batch ID",
        },
        { status: 400 }
      );
    }

    // Fetch the batch document from Firestore
    const batchRef = doc(db, "batches", batchId);
    const batchSnap = await getDoc(batchRef);

    if (!batchSnap.exists()) {
      return NextResponse.json(
        {
          error: "Batch not found",
          details: `No data found for batch ID ${batchId}`,
        },
        { status: 404 }
      );
    }

    // Return the batch data
    const batchData = batchSnap.data();
    return NextResponse.json({
      batchId,
      ...batchData,
      success: true,
    });
  } catch (error) {
    console.error("Error fetching batch:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch batch",
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
    const body = await request.json();
    const { documentId, data } = body;

    if (!documentId || !data) {
      return NextResponse.json(
        {
          error: "Invalid request",
          details: "Request must include documentId and data",
        },
        { status: 400 }
      );
    }

    // Update document in Firestore
    const documentRef = doc(db, "documents", documentId);
    await updateDoc(documentRef, { data });

    return NextResponse.json({
      success: true,
      message: "Document updated successfully",
    });
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
