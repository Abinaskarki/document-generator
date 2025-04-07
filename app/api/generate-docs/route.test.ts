import { POST } from "./route";
import { NextRequest } from "next/server";
import { processTemplate } from "@/lib/document-processor";
import { setDoc } from "firebase/firestore";
import { uploadBytes, getDownloadURL } from "firebase/storage";

jest.mock("@/lib/document-processor", () => ({
  processTemplate: jest.fn(),
}));

jest.mock("firebase/firestore", () => ({
  setDoc: jest.fn(),
}));

jest.mock("firebase/storage", () => ({
  uploadBytes: jest.fn(),
  getDownloadURL: jest
    .fn()
    .mockResolvedValue("https://example.com/generated-document.pdf"),
}));

jest.mock("puppeteer", () => ({
  launch: jest.fn().mockResolvedValue({
    newPage: jest.fn().mockResolvedValue({
      setContent: jest.fn(),
      pdf: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
    }),
    close: jest.fn(),
  }),
}));

describe("generate-docs API", () => {
  it("should return 400 if templateHtml or data is missing", async () => {
    const request = new NextRequest("http://localhost", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("Both template HTML and data are required");
  });

  it("should process the template and return a valid response", async () => {
    (processTemplate as jest.Mock).mockImplementation((html, data) => html);

    const request = new NextRequest("http://localhost", {
      method: "POST",
      body: JSON.stringify({
        templateHtml: "<p>{name}</p>",
        data: [{ name: "John Doe" }],
      }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.pdfDownloadUrl).toBe(
      "https://example.com/generated-document.pdf"
    );
    expect(setDoc).toHaveBeenCalled();
    expect(uploadBytes).toHaveBeenCalled();
  });

  it("should return 500 if an error occurs", async () => {
    (processTemplate as jest.Mock).mockImplementation(() => {
      throw new Error("Test error");
    });

    const request = new NextRequest("http://localhost", {
      method: "POST",
      body: JSON.stringify({
        templateHtml: "<p>{name}</p>",
        data: [{ name: "John Doe" }],
      }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe("Failed to process files");
    expect(json.details).toBe("Test error");
  });
});
