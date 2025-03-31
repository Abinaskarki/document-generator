import { NextRequest, NextResponse } from "next/server";
import { ref, getDownloadURL } from "firebase/storage";
import nodemailer from "nodemailer";
import { storage } from "@/lib/firebase";

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const { batchId, recipient, subject, body } = await request.json();

    if (!batchId || !recipient || !subject || !body) {
      return NextResponse.json(
        {
          error: "All fields (batchId, recipient, subject, body) are required",
        },
        { status: 400 }
      );
    }

    // Fetch the PDF file from Firebase
    const pdfRef = ref(storage, `pdf/${batchId}/generated-document.pdf`);
    const pdfDownloadUrl = await getDownloadURL(pdfRef);

    const pdfResponse = await fetch(pdfDownloadUrl);
    if (!pdfResponse.ok) {
      throw new Error("Failed to fetch the PDF file from Firebase");
    }
    const pdfBuffer = await pdfResponse.arrayBuffer();

    // Configure the email transporter
    const transporter = nodemailer.createTransport({
      service: "gmail", // Use your email service (e.g., Gmail, Outlook, etc.)
      auth: {
        user: process.env.EMAIL_USER, // Your email address
        pass: process.env.EMAIL_PASS, // Your email password or app-specific password
      },
    });

    // Send the email with the PDF attached
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: recipient,
      subject: subject,
      text: body,
      attachments: [
        {
          filename: `generated-document-${batchId}.pdf`,
          content: Buffer.from(pdfBuffer),
        },
      ],
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({
      success: true,
      message: "Email sent successfully",
    });
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { error: "Failed to send email", details: error.message },
      { status: 500 }
    );
  }
}
