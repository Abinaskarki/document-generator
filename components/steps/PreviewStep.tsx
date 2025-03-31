import { Button } from "@/components/ui/button";

export default function PreviewStep({
  templatePreview,
  dataPreview,
  placeholders,
  onPrevious,
  onSubmit,
}: {
  templatePreview: string | null;
  dataPreview: any[];
  placeholders: string[];
  onPrevious: () => void;
  onSubmit: (e?: React.FormEvent) => void;
}) {
  const generateDocumentPreview = () => {
    if (!templatePreview || dataPreview.length === 0) return "";

    const record = dataPreview[0]; // Use the first record for preview
    console.log("Record for preview:", record);
    let preview = templatePreview;

    // Normalize keys in the record by trimming whitespace
    const normalizedRecord = Object.keys(record).reduce((acc, key) => {
      acc[key.trim()] = record[key];
      return acc;
    }, {} as Record<string, string>);

    // Replace placeholders with actual values
    placeholders.forEach((placeholder) => {
      const value = normalizedRecord[placeholder] || "";
      // Use a global regular expression to replace all occurrences of the placeholder
      preview = preview.replace(new RegExp(`\\{${placeholder}\\}`, "g"), value);
    });

    return preview;
  };

  const documentPreview = generateDocumentPreview();

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">
        Step 3: Preview Generated Document
      </h2>
      <div
        className="text-sm bg-white p-3 border rounded-md overflow-auto"
        dangerouslySetInnerHTML={{ __html: documentPreview }}
      />

      <div className="mt-6 flex justify-between">
        <Button variant="outline" onClick={onPrevious}>
          Previous
        </Button>
        <Button onClick={onSubmit} variant="primary">
          Generate Document
        </Button>
      </div>
    </div>
  );
}
