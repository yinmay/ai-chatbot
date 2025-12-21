import { PDFParse } from "pdf-parse";

/**
 * Convert a base64-encoded PDF document to text
 * @param base64String - The base64 string (can be with or without data URI prefix)
 * @returns Extracted text from the PDF
 */
export async function base64ToText(base64String: string): Promise<string> {
  let pdfParse: PDFParse | null = null;

  try {
    // Remove data URI prefix if present (e.g., "data:application/pdf;base64,")
    let base64Data = base64String;
    if (base64String.includes(",")) {
      base64Data = base64String.split(",")[1];
    }

    // Convert base64 to Buffer
    const pdfBuffer = Buffer.from(base64Data, "base64");

    // Parse PDF and extract text using pdf-parse
    pdfParse = new PDFParse({ data: pdfBuffer });
    const result = await pdfParse.getText();

    // Return extracted text
    return result.text;
  } catch (error) {
    console.error("Error converting PDF base64 to text:", error);
    throw new Error(
      `Failed to extract text from PDF: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  } finally {
    // Always cleanup to free memory
    if (pdfParse) {
      await pdfParse.destroy();
    }
  }
}

/**
 * Convert a base64-encoded PDF document to text with metadata
 * @param base64String - The base64 string (can be with or without data URI prefix)
 * @returns Object containing text and metadata
 */
export async function base64ToTextWithMetadata(base64String: string): Promise<{
  text: string;
  numPages: number;
  info: Record<string, unknown>;
  metadata: Record<string, unknown> | null;
}> {
  let pdfParse: PDFParse | null = null;

  try {
    // Remove data URI prefix if present
    let base64Data = base64String;
    if (base64String.includes(",")) {
      base64Data = base64String.split(",")[1];
    }

    // Convert base64 to Buffer
    const pdfBuffer = Buffer.from(base64Data, "base64");

    // Parse PDF
    pdfParse = new PDFParse({ data: pdfBuffer });
    const textResult = await pdfParse.getText();
    const infoResult = await pdfParse.getInfo();

    return {
      text: textResult.text,
      numPages: textResult.total,
      info: infoResult.info || {},
      metadata: (infoResult.metadata || null) as Record<string, unknown> | null,
    };
  } catch (error) {
    console.error("Error converting PDF base64 to text:", error);
    throw new Error(
      `Failed to extract text from PDF: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  } finally {
    // Always cleanup to free memory
    if (pdfParse) {
      await pdfParse.destroy();
    }
  }
}
