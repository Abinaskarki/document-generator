import { type NextRequest, NextResponse } from "next/server";
import {
  collection,
  query,
  where,
  getDocs,
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

    // Fetch documents for the batch
    const documentsQuery = query(
      collection(db, "documents"),
      where("batchId", "==", batchId)
    );
    const documentsSnapshot = await getDocs(documentsQuery);
    const documents = documentsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    if (documents.length === 0) {
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
