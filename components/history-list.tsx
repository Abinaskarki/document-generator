"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Clock, ArrowRight } from "lucide-react"
import Link from "next/link"
import db, { type BatchRecord } from "@/lib/in-memory-db"

export default function HistoryList() {
  const [batches, setBatches] = useState<BatchRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadBatches = async () => {
      try {
        await db.init()
        const batchData = db.getBatches()
        setBatches(batchData)
      } catch (error) {
        console.error("Error loading batches:", error)
      } finally {
        setLoading(false)
      }
    }

    loadBatches()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (batches.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Document History</h3>
            <p className="text-muted-foreground mb-4">
              You haven't generated any documents yet. Create your first document batch to see it here.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">Recent Document Batches</h2>
      {batches.map((batch) => (
        <Card key={batch.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="h-5 w-5 mr-2 text-primary" />
                {batch.title}
              </div>
              <span className="text-sm font-normal text-muted-foreground">
                {new Date(batch.createdAt).toLocaleDateString()}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-2">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {batch.documentCount} document{batch.documentCount !== 1 ? "s" : ""}
                  </p>
                  {batch.originalFormat && (
                    <span className="text-xs px-2 py-1 bg-muted rounded-full mt-2 inline-block">
                      {batch.originalFormat.toUpperCase()}
                    </span>
                  )}
                </div>
                <Link href={`/documents/${batch.id}`}>
                  <Button variant="outline" size="sm" className="gap-1">
                    View Documents
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

