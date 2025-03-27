import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import UploadForm from "@/components/upload-form"
import DefaultTemplates from "@/components/default-templates"
import HistoryList from "@/components/history-list"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"

export default function Home() {
  return (
    <main className="container mx-auto py-10 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Document Generator</h1>
        <Link href="/settings">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        </Link>
      </div>

      <p className="text-gray-600 mb-8">
        Generate multiple documents by combining a template with CSV data. Each row in your CSV will create a new
        document.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="upload">Upload Your Template</TabsTrigger>
              <TabsTrigger value="default">Use Default Templates</TabsTrigger>
            </TabsList>
            <TabsContent value="upload">
              <UploadForm />
            </TabsContent>
            <TabsContent value="default">
              <DefaultTemplates />
            </TabsContent>
          </Tabs>
        </div>

        <div>
          <HistoryList />
        </div>
      </div>
    </main>
  )
}

