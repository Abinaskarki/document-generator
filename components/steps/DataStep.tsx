import { useState } from "react";
import { FileUploader } from "@/components/file-uploader";
import { Button } from "@/components/ui/button";

export default function DataStep({
  dataFile,
  setDataFile,
  dataPreview,
  setDataPreview,
  dataHeaders,
  setDataHeaders,
  placeholders,
  onNext,
  onPrevious,
  editedData,
  setEditedData,
}: {
  dataFile: File | null;
  setDataFile: (file: File | null) => void;
  dataPreview: any[];
  setDataPreview: (data: any[]) => void;
  dataHeaders: string[];
  setDataHeaders: (headers: string[]) => void;
  placeholders: string[];
  onNext: () => void;
  onPrevious: () => void;
  editedData: any[];
  setEditedData: (data: any[]) => void;
}) {
  const handleDataUpload = async (file: File) => {
    setDataFile(file);
    const textContent = await file.text();
    const rows = textContent.split("\n").map((row) => row.split(","));

    // Normalize headers by trimming whitespace
    const headers = rows[0].map((header) => header.trim());

    const data = rows.slice(1).map((row) =>
      headers.reduce((acc, header, index) => {
        acc[header] = row[index]?.trim() || ""; // Trim values and handle undefined
        return acc;
      }, {} as Record<string, string>)
    );

    setDataHeaders(headers);
    setDataPreview(data);
    setEditedData(data); // Initialize editedData with the uploaded data
  };

  const handleCellChange = (
    rowIndex: number,
    header: string,
    value: string
  ) => {
    const updatedData = [...editedData];
    updatedData[rowIndex][header] = value;
    setEditedData(updatedData);
  };

  const handleSaveEdits = () => {
    setDataPreview(editedData); // Save the edited data to dataPreview
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">
        Step 2: Upload or Create Data
      </h2>
      <FileUploader
        id="data"
        accept=".csv"
        onChange={handleDataUpload}
        value={dataFile}
        placeholder="Upload CSV file with your data"
      />

      {dataPreview.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium mb-2">Data Preview (Editable)</h3>
          <table className="table-auto w-full border-collapse border border-gray-300">
            <thead>
              <tr>
                {dataHeaders.map((header) => (
                  <th
                    key={header}
                    className="border border-gray-300 px-4 py-2 text-left text-sm font-medium"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {editedData.slice(0, 5).map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {dataHeaders.map((header) => (
                    <td
                      key={header}
                      className="border border-gray-300 px-4 py-2 text-sm"
                    >
                      <input
                        type="text"
                        value={row[header] || ""}
                        onChange={(e) =>
                          handleCellChange(rowIndex, header, e.target.value)
                        }
                        className="w-full border border-gray-300 rounded px-2 py-1"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-end mt-4">
            <Button onClick={handleSaveEdits}>Save Edits</Button>
          </div>
        </div>
      )}

      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={onPrevious}>
          Previous
        </Button>
        <Button onClick={onNext} disabled={dataPreview.length === 0}>
          Next
        </Button>
      </div>
    </div>
  );
}
