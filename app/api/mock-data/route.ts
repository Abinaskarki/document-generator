import { type NextRequest, NextResponse } from "next/server";
import {
  findTemplateById,
  generateMockData,
  generateCustomMockData,
  MOCK_DATA_TEMPLATES,
} from "@/lib/mock-data-service";

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const templateId = searchParams.get("templateId");
    const count = Number.parseInt(searchParams.get("count") || "3", 10);
    const fields = searchParams.get("fields")?.split(",") || [];

    // Validate parameters
    if (count < 1 || count > 50) {
      return NextResponse.json(
        { error: "Count must be between 1 and 50" },
        { status: 400 }
      );
    }

    let data: Record<string, string>[] = [];

    if (templateId) {
      // Find the template by ID
      const template = findTemplateById(templateId);

      if (!template) {
        return NextResponse.json(
          {
            error: "Template not found",
            availableTemplates: MOCK_DATA_TEMPLATES.map((t) => ({
              id: t.id,
              name: t.name,
            })),
          },
          { status: 404 }
        );
      }

      // Generate mock data based on the template
      data = generateMockData(template, count);
    } else if (fields.length > 0) {
      // Generate custom mock data based on the provided fields
      data = generateCustomMockData(fields, count);
    } else {
      return NextResponse.json(
        {
          error: "Either templateId or fields must be provided",
          availableTemplates: MOCK_DATA_TEMPLATES.map((t) => ({
            id: t.id,
            name: t.name,
          })),
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("Error generating mock data:", error);
    return NextResponse.json(
      {
        error: `Failed to generate mock data: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    if (
      !body.fields ||
      !Array.isArray(body.fields) ||
      body.fields.length === 0
    ) {
      return NextResponse.json(
        { error: "Fields array is required" },
        { status: 400 }
      );
    }

    const count = body.count || 3;

    // Validate count
    if (count < 1 || count > 50) {
      return NextResponse.json(
        { error: "Count must be between 1 and 50" },
        { status: 400 }
      );
    }

    // Generate custom mock data based on the provided fields
    const data = generateCustomMockData(body.fields, count);

    return NextResponse.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("Error generating mock data:", error);
    return NextResponse.json(
      {
        error: `Failed to generate mock data: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      },
      { status: 500 }
    );
  }
}
