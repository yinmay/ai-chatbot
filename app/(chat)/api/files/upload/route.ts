import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/app/(auth)/auth";

// Allowed file types
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "application/pdf"];

// Use Blob instead of File since File is not available in Node.js environment
const FileSchema = z.object({
  file: z
    .instanceof(Blob)
    .refine((file) => file.size <= 10 * 1024 * 1024, {
      message: "File size should be less than 10MB",
    })
    .refine((file) => ALLOWED_FILE_TYPES.includes(file.type), {
      message: "File type should be JPEG, PNG, or PDF",
    }),
});

// Check if we should use base64 data URL (when Vercel Blob token is not available)
const useBase64 = !process.env.BLOB_READ_WRITE_TOKEN;

function toBase64DataUrl(buffer: ArrayBuffer, contentType: string): string {
  const base64 = Buffer.from(buffer).toString("base64");
  return `data:${contentType};base64,${base64}`;
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (request.body === null) {
    return new Response("Request body is empty", { status: 400 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as Blob;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const validatedFile = FileSchema.safeParse({ file });

    if (!validatedFile.success) {
      const errorMessage = validatedFile.error.errors
        .map((error) => error.message)
        .join(", ");

      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    // Get filename from formData since Blob doesn't have name property
    const filename = (formData.get("file") as File).name;
    const fileBuffer = await file.arrayBuffer();

    try {
      if (useBase64) {
        // Use base64 data URL for development (no external storage needed)
        const dataUrl = toBase64DataUrl(fileBuffer, file.type);
        return NextResponse.json({
          url: dataUrl,
          pathname: filename,
          contentType: file.type,
        });
      }

      // Use Vercel Blob for production
      const data = await put(`${filename}`, fileBuffer, {
        access: "public",
      });

      return NextResponse.json(data);
    } catch (error) {
      console.error("Upload error:", error);
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
