import { tool } from "ai";
import { z } from "zod";
import { findRelevantContent } from "@/lib/ai/embedding";

export const findDocumentByRAG = (namespaceId?: string) =>
  tool({
    description: `get information from your knowledge base to answer questions.`,
    inputSchema: z.object({
      question: z.string().describe("the users question"),
    }),
    execute: async ({ question }) => findRelevantContent(question, namespaceId),
  });
