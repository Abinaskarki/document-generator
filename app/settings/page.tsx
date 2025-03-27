import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import DbControls from "@/components/db-controls"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function SettingsPage() {
  return (
    <main className="container mx-auto py-10 px-4">
      <div className="flex items-center mb-8">
        <Link href="/">
          <Button variant="ghost" className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Application Settings</CardTitle>
              <CardDescription>Configure your document generator application settings</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                This application uses an in-memory database with localStorage persistence. Your data is stored in your
                browser and will persist between sessions.
              </p>
              <p className="text-muted-foreground">
                Use the database controls to export your data for backup or to transfer to another device.
              </p>
            </CardContent>
          </Card>
        </div>

        <div>
          <DbControls />
        </div>
      </div>
    </main>
  )
}

