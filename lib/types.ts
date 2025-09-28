import { z } from "zod";
import type { getWeather } from "./ai/tools/get-weather";
import type { createDocument } from "./ai/tools/create-document";
import type { updateDocument } from "./ai/tools/update-document";
import type { requestSuggestions } from "./ai/tools/request-suggestions";
import type { findDocumentByRAG } from "./ai/tools/rag-doc";
import type { InferUITool, UIMessage } from "ai";
import type { AppUsage } from "./usage";

import type { ArtifactKind } from "@/components/artifact";
import type {
  Namespace,
  Resources,
  Suggestion,
  Embeddings,
} from "@/lib/db/schema";

export type DataPart = { type: "append-message"; message: string };

export const messageMetadataSchema = z.object({
  createdAt: z.string(),
});

export type MessageMetadata = z.infer<typeof messageMetadataSchema>;

type weatherTool = InferUITool<typeof getWeather>;
type createDocumentTool = InferUITool<ReturnType<typeof createDocument>>;
type updateDocumentTool = InferUITool<ReturnType<typeof updateDocument>>;
type requestSuggestionsTool = InferUITool<
  ReturnType<typeof requestSuggestions>
>;

type findDocumentByRAGTool = InferUITool<ReturnType<typeof findDocumentByRAG>>;

export type ChatTools = {
  getWeather: weatherTool;
  createDocument: createDocumentTool;
  updateDocument: updateDocumentTool;
  requestSuggestions: requestSuggestionsTool;
  findDocumentByRAGTool: findDocumentByRAGTool;
};

export type CustomUIDataTypes = {
  textDelta: string;
  imageDelta: string;
  sheetDelta: string;
  codeDelta: string;
  suggestion: Suggestion;
  appendMessage: string;
  id: string;
  title: string;
  kind: ArtifactKind;
  clear: null;
  finish: null;
  usage: AppUsage;
};

export type ChatMessage = UIMessage<
  MessageMetadata,
  CustomUIDataTypes,
  ChatTools
>;

export interface Attachment {
  name: string;
  url: string;
  contentType: string;
}

export type MultiResponse<T> = {
  objects: T[];
  page_index: number;
  per_page: number;
  total: number;
  has_more: boolean;
};

export const pagedParam = z.object({
  page_index: z.coerce.number().default(1),
  per_page: z.coerce.number().default(5),
});

export type PagedParam = z.infer<typeof pagedParam>;

export const namespaceRequest = z.object({
  name: z.string(),
  fileIds: z.array(z.string()),
});

export type NamespaceRequest = z.infer<typeof namespaceRequest>;

// export type NamespaceWithResources = {
//   namespace: Namespace;
//   resources: Resources[];
// };

export type FileResult = {
  id?: string;
  file: File;
  message: string;
};

const fileObject = z.object({
  id: z.string().nullable(),
  name: z.string(),
  message: z.string(),
});
export const fileResponse = z.object({
  okFiles: z.array(fileObject),
  ngFiles: z.array(fileObject),
});
export type FileResponse = z.infer<typeof fileResponse>;
