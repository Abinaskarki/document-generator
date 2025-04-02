import { useState } from "react";
import { FileUploader } from "@/components/file-uploader";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx";

const MAX_ROWS = 100;

export default function DataStep({
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
  const [file, setFile] = useState<File | null>(null); // New file state
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (file: File | null, error?: string) => {
    setFile(file);
    setError(error || null); // Update the error state if an error is provided
    if (file) {
      handleDataUpload(file); // Process the file when it's uploaded
    }
  };

  const handleDataUpload = async (file: File) => {
    setError(null); // Reset error state

    try {
      if (file.name.endsWith(".csv")) {
        // Handle CSV file
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

        // Check if the file has more than MAX_ROWS rows
        if (data.length > MAX_ROWS) {
          setError(
            `The uploaded file contains more than ${MAX_ROWS} rows. Please upload a file with ${MAX_ROWS} or fewer rows.`
          );
          setFile(null);
          setDataHeaders([]);
          setDataPreview([]);
          setEditedData([]);
          return;
        }

        setDataHeaders(headers);
        setDataPreview(data);
        setEditedData(data); // Initialize editedData with the uploaded data
      } else if (file.name.endsWith(".xlsx")) {
        // Handle XLSX file
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const sheetName = workbook.SheetNames[0]; // Use the first sheet
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        // Normalize headers by trimming whitespace
        const headers = (jsonData[0] as string[]).map((header) =>
          header.trim()
        );

        const data = jsonData.slice(1).map((row) =>
          headers.reduce((acc, header, index) => {
            acc[header] = (row[index] as string)?.trim() || ""; // Trim values and handle undefined
            return acc;
          }, {} as Record<string, string>)
        );

        // Check if the file has more than MAX_ROWS rows
        if (data.length > MAX_ROWS) {
          setError(
            `The uploaded file contains more than ${MAX_ROWS} rows. Please upload a file with ${MAX_ROWS} or fewer rows.`
          );
          setFile(null);
          setDataHeaders([]);
          setDataPreview([]);
          setEditedData([]);
          return;
        }

        setDataHeaders(headers);
        setDataPreview(data);
        setEditedData(data); // Initialize editedData with the uploaded data
      } else {
        setError(
          "Unsupported file format. Please upload a .csv or .xlsx file."
        );
        setFile(null);
      }
    } catch (err) {
      setError("Failed to process the uploaded file. Please try again.");
    }
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
        accept=".csv, .xlsx" // Allow both .csv and .xlsx files
        onChange={handleFileChange} // Use the new handleFileChange function
        value={file} // Bind the new file state
        placeholder="Upload CSV or Excel file with your data"
      />
      {file && (
        <div className="mt-2">
          <p className="text-sm text-gray-600">Uploaded File: {file.name}</p>
        </div>
      )}

      {error && (
        <div className="mt-4 text-red-500 text-sm">
          <p>{error}</p>
        </div>
      )}

      {dataPreview.length > 0 && !error && (
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
        <Button onClick={onNext} disabled={dataPreview.length === 0 || !!error}>
          Next
        </Button>
      </div>
    </div>
  );
}
