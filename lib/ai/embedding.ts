import { embed, embedMany } from "ai";
// import { openai } from "@ai-sdk/openai";
import { createOllama } from "ollama-ai-provider-v2";
import { findEmbedding } from "@/lib/db/queries";

const ollama = createOllama({
  baseURL: "http://localhost:11434/api",
});
const embeddingModel = ollama.textEmbeddingModel("nomic-embed-text");

const generateChunks = (input: string): string[] => {
  return input
    .trim()
    .split(".")
    .filter((i) => i !== "");
};

export type EmbeddingContent = {
  embedding: number[];
  content: string;
};
export const generateEmbeddings = async (
  value: string,
): Promise<Array<EmbeddingContent>> => {
  const chunks = generateChunks(value);
  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: chunks,
  });
  return embeddings.map((e, i) => ({ content: chunks[i], embedding: e }));
};

export const generateEmbedding = async (value: string): Promise<number[]> => {
  const input = value.replaceAll("\\n", " ");
  const { embedding } = await embed({
    model: embeddingModel,
    value: input,
  });
  return embedding;
};

export const findRelevantContent = async (
  userQuery: string,
  namespaceId?: string,
) => {
  console.log("call rag tool!!");
  const userQueryEmbedded = await generateEmbedding(userQuery);

  const similarGuides = await findEmbedding(userQueryEmbedded, namespaceId);

  return similarGuides;
};
