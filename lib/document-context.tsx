"use client";

import type React from "react";
import { createContext, useContext, useState, useEffect } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// Define types for our document data
export interface DocumentBatch {
  batchId: string;
  templateId: string;
  documentCount: number;
  placeholders?: string[];
  matchedPlaceholders?: string[];
  unmatchedPlaceholders?: string[];
  csvHeaders?: string[];
  originalFormat?: string;
  timestamp: number;
  title: string;
}

export interface DocumentData {
  id: string;
  title: string;
  data: Record<string, string>;
  templateId: string;
  content?: string;
  docxBase64?: string;
  placeholders?: string[];
  originalFormat?: string;
  csvHeaders?: string[];
  batchId: string;
}

interface DocumentContextType {
  batches: DocumentBatch[];
  documents: Record<string, DocumentData[]>;
  addBatch: (batch: Omit<DocumentBatch, "timestamp" | "title">) => void;
  addDocuments: (batchId: string, docs: DocumentData[]) => void;
  getBatchById: (batchId: string) => DocumentBatch | undefined;
  getDocumentsByBatchId: (batchId: string) => DocumentData[];
  updateDocument: (documentId: string, data: Record<string, string>) => void;
  clearAll: () => void;
}

// Create the context with a default value
const DocumentContext = createContext<DocumentContextType>({
  batches: [],
  documents: {},
  addBatch: () => {},
  addDocuments: () => {},
  getBatchById: () => undefined,
  getDocumentsByBatchId: () => [],
  updateDocument: () => {},
  clearAll: () => {},
});

// Storage keys
const BATCHES_STORAGE_KEY = "document_generator_batches";
const DOCUMENTS_STORAGE_KEY = "document_generator_documents";

export const DocumentProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [batches, setBatches] = useState<DocumentBatch[]>([]);
  const [documents, setDocuments] = useState<Record<string, DocumentData[]>>(
    {}
  );
  const [isInitialized, setIsInitialized] = useState(false);

  // Load data from sessionStorage on initial mount
  useEffect(() => {
    if (typeof window !== "undefined" && !isInitialized) {
      try {
        const storedBatches = sessionStorage.getItem(BATCHES_STORAGE_KEY);
        const storedDocuments = sessionStorage.getItem(DOCUMENTS_STORAGE_KEY);

        if (storedBatches) {
          setBatches(JSON.parse(storedBatches));
        }

        if (storedDocuments) {
          setDocuments(JSON.parse(storedDocuments));
        }
      } catch (error) {
        console.error("Error loading data from sessionStorage:", error);
      }

      setIsInitialized(true);
    }
  }, [isInitialized]);

  // Save data to sessionStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined" && isInitialized) {
      try {
        sessionStorage.setItem(BATCHES_STORAGE_KEY, JSON.stringify(batches));
        sessionStorage.setItem(
          DOCUMENTS_STORAGE_KEY,
          JSON.stringify(documents)
        );
      } catch (error) {
        console.error("Error saving data to sessionStorage:", error);
      }
    }
  }, [batches, documents, isInitialized]);

  // Add a new batch
  const addBatch = (batch: Omit<DocumentBatch, "timestamp" | "title">) => {
    const templateType =
      batch.templateId || batch.batchId.split("-")[0] || "custom";

    // Format template name for display
    const templateName =
      templateType === "custom"
        ? "Custom Template"
        : `${
            templateType.charAt(0).toUpperCase() + templateType.slice(1)
          } Template`;

    const newBatch: DocumentBatch = {
      ...batch,
      timestamp: Date.now(),
      title: templateName,
    };

    setBatches((prev) => [newBatch, ...prev]);
  };

  // Add documents to a batch
  const addDocuments = (batchId: string, docs: DocumentData[]) => {
    setDocuments((prev) => ({
      ...prev,
      [batchId]: docs as DocumentData[],
    }));
  };

  // Get a batch by ID
  const getBatchById = (batchId: string) => {
    return batches.find((batch) => batch.batchId === batchId);
  };

  // Get documents by batch ID
  const getDocumentsByBatchId = (batchId: string) => {
    return documents[batchId] || [];
  };

  // Update a document
  const updateDocument = (documentId: string, data: Record<string, string>) => {
    setDocuments((prev) => {
      const newDocuments = { ...prev };

      // Find the batch that contains this document
      for (const batchId in newDocuments) {
        const docIndex = newDocuments[batchId].findIndex(
          (doc) => doc.id === documentId
        );

        if (docIndex !== -1) {
          // Create a new array for this batch
          newDocuments[batchId] = [...newDocuments[batchId]];
          // Update the document
          newDocuments[batchId][docIndex] = {
            ...newDocuments[batchId][docIndex],
            data,
          };
          break;
        }
      }

      return newDocuments;
    });
  };

  // Clear all data
  const clearAll = () => {
    setBatches([]);
    setDocuments({});

    if (typeof window !== "undefined") {
      sessionStorage.removeItem(BATCHES_STORAGE_KEY);
      sessionStorage.removeItem(DOCUMENTS_STORAGE_KEY);
    }
  };

  // Fetch batch information from Firebase
  const fetchBatchFromFirebase = async (batchId: string) => {
    try {
      // Fetch batch metadata
      const batchDoc = await getDoc(doc(db, "batches", batchId));
      if (!batchDoc.exists()) {
        console.error(`Batch with ID ${batchId} not found.`);
        return null;
      }

      const batchData = batchDoc.data();

      // Fetch documents for the batch
      const documentsQuery = query(
        collection(db, "documents"),
        where("batchId", "==", batchId)
      );
      const documentsSnapshot = await getDocs(documentsQuery);
      const docs = documentsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const batch: DocumentBatch = {
        batchId: batchData.batchId as string,
        templateId: batchData.templateId as string,
        documentCount: docs.length,
        timestamp: (batchData.timestamp as number) || Date.now(),
        title:
          (batchData.title as string) || `${batchData.templateId} Template`,
        placeholders: batchData.placeholders,
        matchedPlaceholders: batchData.matchedPlaceholders,
        unmatchedPlaceholders: batchData.unmatchedPlaceholders,
        csvHeaders: batchData.csvHeaders,
        originalFormat: batchData.originalFormat,
      };

      setBatches((prev) => [...prev, batch]); // Cache the batch in local state
      setDocuments((prev) => ({
        ...prev,
        [batchId]: docs,
      }));
      return batch;
    } catch (error) {
      console.error("Error fetching batch from Firebase:", error);
      return null;
    }
  };

  return (
    <DocumentContext.Provider
      value={{
        batches,
        documents,
        addBatch,
        addDocuments,
        getBatchById,
        getDocumentsByBatchId,
        updateDocument,
        clearAll,
        fetchBatchFromFirebase,
      }}
    >
      {children}
    </DocumentContext.Provider>
  );
};

// Custom hook to use the document context
export const useDocuments = () => useContext(DocumentContext);
