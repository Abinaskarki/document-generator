import { POST } from "./route";
import { NextRequest } from "next/server";
import { createZip } from "@/lib/zip-service";
import { uploadBytes, getDownloadURL } from "firebase/storage";

jest.mock("@/lib/zip-service", () => ({
  createZip: jest.fn(),
}));

jest.mock("firebase/storage", () => ({
  uploadBytes: jest.fn(),
  getDownloadURL: jest
    .fn()
    .mockResolvedValue("https://example.com/generated-zip.zip"),
}));

describe("generate-zip-docs API", () => {
  it("should return 400 if required fields are missing", async () => {
    const request = new NextRequest("http://localhost", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("Missing required fields");
  });

  it("should generate a zip file and return success", async () => {
    (createZip as jest.Mock).mockResolvedValue(new Uint8Array([1, 2, 3]));

    const request = new NextRequest("http://localhost", {
      method: "POST",
      body: JSON.stringify({
        files: [{ name: "file1.txt", content: "Hello World" }],
      }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.zipDownloadUrl).toBe("https://example.com/generated-zip.zip");
    expect(uploadBytes).toHaveBeenCalled();
  });

  it("should return 500 if an error occurs", async () => {
    (createZip as jest.Mock).mockRejectedValue(new Error("Test error"));

    const request = new NextRequest("http://localhost", {
      method: "POST",
      body: JSON.stringify({
        files: [{ name: "file1.txt", content: "Hello World" }],
      }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe("Failed to generate zip");
    expect(json.details).toBe("Test error");
  });
});
