// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse");

export type PDFContent = {
  text: string;
  numPages: number;
  info: {
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
  };
};

/**
 * Extract text content from a PDF buffer
 */
export async function extractPDFText(buffer: Buffer): Promise<PDFContent> {
  const data = await pdfParse(buffer);

  return {
    text: data.text,
    numPages: data.numpages,
    info: {
      title: data.info?.Title,
      author: data.info?.Author,
      subject: data.info?.Subject,
      creator: data.info?.Creator,
    },
  };
}

/**
 * Extract text from a PDF URL (supports base64 data URLs and remote URLs)
 */
export async function extractPDFFromUrl(url: string): Promise<PDFContent> {
  // Check if this is a base64 data URL
  if (url.startsWith("data:")) {
    // Parse data URL: data:application/pdf;base64,<base64data>
    const matches = url.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) {
      throw new Error("Invalid data URL format");
    }
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, "base64");
    return extractPDFText(buffer);
  }

  // For remote URLs, use fetch
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch PDF: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return extractPDFText(buffer);
}

/**
 * Format PDF content for AI consumption
 */
export function formatPDFForAI(content: PDFContent, filename: string): string {
  const parts: string[] = [];

  parts.push(`[PDF Document: ${filename}]`);

  if (content.info.title) {
    parts.push(`Title: ${content.info.title}`);
  }
  if (content.info.author) {
    parts.push(`Author: ${content.info.author}`);
  }

  parts.push(`Pages: ${content.numPages}`);
  parts.push("");
  parts.push("--- Content ---");
  parts.push(content.text);
  parts.push("--- End of PDF ---");

  return parts.join("\n");
}
