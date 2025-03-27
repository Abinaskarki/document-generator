/**
 * In-Memory Database with persistence
 *
 * This module provides a simple in-memory database with localStorage persistence
 * for small to medium-sized applications that don't require a full database.
 */

// Define database collections
export interface DBSchema {
  batches: BatchRecord[]
  documents: DocumentRecord[]
  settings: Record<string, any>
}

export interface BatchRecord {
  id: string
  templateId: string
  title: string
  documentCount: number
  createdAt: number
  placeholders?: string[]
  csvHeaders?: string[]
  originalFormat?: string
  metadata?: Record<string, any>
}

export interface DocumentRecord {
  id: string
  batchId: string
  title: string
  content?: string
  docxBase64?: string
  data: Record<string, string>
  placeholders?: string[]
  csvHeaders?: string[]
  originalFormat?: string
  createdAt: number
  updatedAt: number
  metadata?: Record<string, any>
}

// Storage keys
const DB_STORAGE_KEY = "document_generator_db"
const AUTO_SAVE_INTERVAL = 5000 // 5 seconds

class InMemoryDB {
  private data: DBSchema
  private autoSaveTimer: NodeJS.Timeout | null = null
  private isInitialized = false

  constructor() {
    // Initialize with empty collections
    this.data = {
      batches: [],
      documents: [],
      settings: {},
    }
  }

  /**
   * Initialize the database by loading data from localStorage
   */
  public async init(): Promise<void> {
    if (this.isInitialized) return

    if (typeof window !== "undefined") {
      try {
        const storedData = localStorage.getItem(DB_STORAGE_KEY)
        if (storedData) {
          this.data = JSON.parse(storedData)
          console.log("Database loaded from localStorage")
        }
      } catch (error) {
        console.error("Error loading database from localStorage:", error)
      }

      // Set up auto-save
      this.autoSaveTimer = setInterval(() => this.saveToStorage(), AUTO_SAVE_INTERVAL)
    }

    this.isInitialized = true
  }

  /**
   * Save the current database state to localStorage
   */
  public saveToStorage(): void {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(this.data))
      } catch (error) {
        console.error("Error saving database to localStorage:", error)
      }
    }
  }

  /**
   * Export the entire database as JSON
   */
  public exportData(): string {
    return JSON.stringify(this.data)
  }

  /**
   * Import data from JSON
   */
  public importData(jsonData: string): boolean {
    try {
      const parsedData = JSON.parse(jsonData)
      if (parsedData.batches && parsedData.documents) {
        this.data = parsedData
        this.saveToStorage()
        return true
      }
      return false
    } catch (error) {
      console.error("Error importing data:", error)
      return false
    }
  }

  /**
   * Clear all data from the database
   */
  public clearAll(): void {
    this.data = {
      batches: [],
      documents: [],
      settings: {},
    }
    this.saveToStorage()
  }

  // Batch operations
  public getBatches(): BatchRecord[] {
    return [...this.data.batches]
  }

  public getBatchById(id: string): BatchRecord | undefined {
    return this.data.batches.find((batch) => batch.id === id)
  }

  public addBatch(batch: Omit<BatchRecord, "createdAt">): BatchRecord {
    const newBatch: BatchRecord = {
      ...batch,
      createdAt: Date.now(),
    }

    this.data.batches.unshift(newBatch)
    this.saveToStorage()
    return newBatch
  }

  public updateBatch(id: string, updates: Partial<BatchRecord>): BatchRecord | null {
    const index = this.data.batches.findIndex((batch) => batch.id === id)
    if (index === -1) return null

    const updatedBatch = {
      ...this.data.batches[index],
      ...updates,
    }

    this.data.batches[index] = updatedBatch
    this.saveToStorage()
    return updatedBatch
  }

  public deleteBatch(id: string): boolean {
    const initialLength = this.data.batches.length
    this.data.batches = this.data.batches.filter((batch) => batch.id !== id)

    // Also delete all documents in this batch
    this.data.documents = this.data.documents.filter((doc) => doc.batchId !== id)

    this.saveToStorage()
    return this.data.batches.length < initialLength
  }

  // Document operations
  public getDocuments(): DocumentRecord[] {
    return [...this.data.documents]
  }

  public getDocumentsByBatchId(batchId: string): DocumentRecord[] {
    return this.data.documents.filter((doc) => doc.batchId === batchId)
  }

  public getDocumentById(id: string): DocumentRecord | undefined {
    return this.data.documents.find((doc) => doc.id === id)
  }

  public addDocument(document: Omit<DocumentRecord, "createdAt" | "updatedAt">): DocumentRecord {
    const now = Date.now()
    const newDocument: DocumentRecord = {
      ...document,
      createdAt: now,
      updatedAt: now,
    }

    this.data.documents.push(newDocument)

    // Update document count in the batch
    const batch = this.getBatchById(document.batchId)
    if (batch) {
      this.updateBatch(batch.id, {
        documentCount: this.getDocumentsByBatchId(batch.id).length + 1,
      })
    }

    this.saveToStorage()
    return newDocument
  }

  public addDocuments(documents: Omit<DocumentRecord, "createdAt" | "updatedAt">[]): DocumentRecord[] {
    if (documents.length === 0) return []

    const now = Date.now()
    const newDocuments: DocumentRecord[] = documents.map((doc) => ({
      ...doc,
      createdAt: now,
      updatedAt: now,
    }))

    this.data.documents.push(...newDocuments)

    // Update document count in the batch if all documents are from the same batch
    const batchId = documents[0].batchId
    if (documents.every((doc) => doc.batchId === batchId)) {
      const batch = this.getBatchById(batchId)
      if (batch) {
        this.updateBatch(batch.id, {
          documentCount: this.getDocumentsByBatchId(batchId).length,
        })
      }
    }

    this.saveToStorage()
    return newDocuments
  }

  public updateDocument(
    id: string,
    updates: Partial<Omit<DocumentRecord, "id" | "createdAt" | "updatedAt">>,
  ): DocumentRecord | null {
    const index = this.data.documents.findIndex((doc) => doc.id === id)
    if (index === -1) return null

    const updatedDocument = {
      ...this.data.documents[index],
      ...updates,
      updatedAt: Date.now(),
    }

    this.data.documents[index] = updatedDocument
    this.saveToStorage()
    return updatedDocument
  }

  public deleteDocument(id: string): boolean {
    const doc = this.getDocumentById(id)
    if (!doc) return false

    const batchId = doc.batchId
    const initialLength = this.data.documents.length
    this.data.documents = this.data.documents.filter((doc) => doc.id !== id)

    // Update document count in the batch
    const batch = this.getBatchById(batchId)
    if (batch) {
      this.updateBatch(batch.id, {
        documentCount: this.getDocumentsByBatchId(batchId).length,
      })
    }

    this.saveToStorage()
    return this.data.documents.length < initialLength
  }

  // Settings operations
  public getSetting<T>(key: string, defaultValue: T): T {
    return (this.data.settings[key] as T) ?? defaultValue
  }

  public setSetting(key: string, value: any): void {
    this.data.settings[key] = value
    this.saveToStorage()
  }

  // Cleanup resources
  public destroy(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer)
      this.autoSaveTimer = null
    }
  }
}

// Create a singleton instance
const db = new InMemoryDB()

// Initialize the database when this module is imported
if (typeof window !== "undefined") {
  db.init().catch(console.error)
}

export default db

