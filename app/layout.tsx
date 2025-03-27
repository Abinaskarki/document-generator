import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { DocumentProvider } from "@/lib/document-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Document Generator",
  description: "Generate documents from templates using CSV data",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <DocumentProvider>
          <div className="min-h-screen bg-gray-50">{children}</div>
        </DocumentProvider>
      </body>
    </html>
  )
}



import './globals.css'