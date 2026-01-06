import { z } from "zod";

const textPartSchema = z.object({
  type: z.enum(["text"]),
  text: z.string().min(1).max(200_000_000),
});

// Custom URL validator that accepts both http(s) URLs and data URLs
const urlOrDataUrl = z.string().refine(
  (val) => {
    // Accept data URLs (base64 encoded files)
    if (val.startsWith("data:")) {
      return true;
    }
    // Accept http/https URLs
    try {
      new URL(val);
      return true;
    } catch {
      return false;
    }
  },
  { message: "Invalid URL format" }
);

const filePartSchema = z.object({
  type: z.enum(["file"]),
  mediaType: z.enum(["image/jpeg", "image/png", "application/pdf"]),
  name: z.string().min(1).max(100),
  url: urlOrDataUrl,
});

const partSchema = z.union([textPartSchema, filePartSchema]);

const userMessageSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(["user"]),
  parts: z.array(partSchema),
});

// For tool approval flows, we accept all messages (more permissive schema)
const messageSchema = z.object({
  id: z.string(),
  role: z.string(),
  parts: z.array(z.any()),
});

export const postRequestBodySchema = z.object({
  id: z.string().uuid(),
  // Either a single new message or all messages (for tool approvals)
  message: userMessageSchema.optional(),
  messages: z.array(messageSchema).optional(),
  selectedChatModel: z.string(),
  selectedVisibilityType: z.enum(["public", "private"]),
});

export type PostRequestBody = z.infer<typeof postRequestBodySchema>;
