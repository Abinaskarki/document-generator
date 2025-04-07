import { POST } from "./route";
import { NextRequest } from "next/server";
import { sendEmail } from "@/lib/email-service";

jest.mock("@/lib/email-service", () => ({
  sendEmail: jest.fn(),
}));

describe("send-email API", () => {
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

  it("should send an email and return success", async () => {
    (sendEmail as jest.Mock).mockResolvedValue(true);

    const request = new NextRequest("http://localhost", {
      method: "POST",
      body: JSON.stringify({
        to: "test@example.com",
        subject: "Test Email",
        body: "This is a test email.",
      }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(sendEmail).toHaveBeenCalled();
  });

  it("should return 500 if an error occurs", async () => {
    (sendEmail as jest.Mock).mockRejectedValue(new Error("Test error"));

    const request = new NextRequest("http://localhost", {
      method: "POST",
      body: JSON.stringify({
        to: "test@example.com",
        subject: "Test Email",
        body: "This is a test email.",
      }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe("Failed to send email");
    expect(json.details).toBe("Test error");
  });
});
