import "server-only";
import fs from "fs";
import path from "path";

import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  inArray,
  lt,
  type SQL,
  cosineDistance,
  sql,
} from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import {
  user,
  chat,
  type User,
  document,
  type Suggestion,
  suggestion,
  message,
  vote,
  type DBMessage,
  type Chat,
  stream,
  resources,
  type Resources,
  embeddings,
  namespace,
  type InsertResourceSchema,
  type NamespaceWithResources,
  InsertFileSchema,
  fileTable,
  Namespace,
} from "./schema";
import { generateEmbeddings, type EmbeddingContent } from "@/lib/ai/embedding";
import type { ArtifactKind } from "@/components/artifact";
import { generateUUID } from "../utils";
import { generateHashedPassword } from "./utils";
import type { VisibilityType } from "@/components/visibility-selector";
import { ChatSDKError } from "../errors";
import type { AppUsage } from "../usage";
import { generateSummary, generateTitleForDoc } from "@/app/(chat)/actions";

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export async function getUser(email: string): Promise<Array<User>> {
  try {
    return await db.select().from(user).where(eq(user.email, email));
  } catch (error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get user by email",
    );
  }
}

export async function createUser(email: string, password: string) {
  const hashedPassword = generateHashedPassword(password);

  try {
    return await db.insert(user).values({ email, password: hashedPassword });
  } catch (error) {
    throw new ChatSDKError("bad_request:database", "Failed to create user");
  }
}

export async function createGuestUser() {
  const email = `guest-${Date.now()}`;
  const password = generateHashedPassword(generateUUID());

  try {
    return await db.insert(user).values({ email, password }).returning({
      id: user.id,
      email: user.email,
    });
  } catch (error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to create guest user",
    );
  }
}

export async function saveChat({
  id,
  userId,
  title,
  visibility,
}: {
  id: string;
  userId: string;
  title: string;
  visibility: VisibilityType;
}) {
  try {
    return await db.insert(chat).values({
      id,
      createdAt: new Date(),
      userId,
      title,
      visibility,
    });
  } catch (error) {
    console.log("error", error);
    throw new ChatSDKError("bad_request:database", "Failed to save chat");
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    await db.delete(vote).where(eq(vote.chatId, id));
    await db.delete(message).where(eq(message.chatId, id));
    await db.delete(stream).where(eq(stream.chatId, id));

    const [chatsDeleted] = await db
      .delete(chat)
      .where(eq(chat.id, id))
      .returning();
    return chatsDeleted;
  } catch (error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete chat by id",
    );
  }
}

export async function getChatsByUserId({
  id,
  limit,
  startingAfter,
  endingBefore,
}: {
  id: string;
  limit: number;
  startingAfter: string | null;
  endingBefore: string | null;
}) {
  try {
    const extendedLimit = limit + 1;

    const query = (whereCondition?: SQL<any>) =>
      db
        .select()
        .from(chat)
        .where(
          whereCondition
            ? and(whereCondition, eq(chat.userId, id))
            : eq(chat.userId, id),
        )
        .orderBy(desc(chat.createdAt))
        .limit(extendedLimit);

    let filteredChats: Array<Chat> = [];

    if (startingAfter) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, startingAfter))
        .limit(1);

      if (!selectedChat) {
        throw new ChatSDKError(
          "not_found:database",
          `Chat with id ${startingAfter} not found`,
        );
      }

      filteredChats = await query(gt(chat.createdAt, selectedChat.createdAt));
    } else if (endingBefore) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, endingBefore))
        .limit(1);

      if (!selectedChat) {
        throw new ChatSDKError(
          "not_found:database",
          `Chat with id ${endingBefore} not found`,
        );
      }

      filteredChats = await query(lt(chat.createdAt, selectedChat.createdAt));
    } else {
      filteredChats = await query();
    }

    const hasMore = filteredChats.length > limit;

    return {
      chats: hasMore ? filteredChats.slice(0, limit) : filteredChats,
      hasMore,
    };
  } catch (error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get chats by user id",
    );
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
    if (!selectedChat) {
      return null;
    }

    return selectedChat;
  } catch (error) {
    throw new ChatSDKError("bad_request:database", "Failed to get chat by id");
  }
}

export async function saveMessages({
  messages,
}: {
  messages: Array<DBMessage>;
}) {
  try {
    return await db.insert(message).values(messages);
  } catch (error) {
    throw new ChatSDKError("bad_request:database", "Failed to save messages");
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(message)
      .where(eq(message.chatId, id))
      .orderBy(asc(message.createdAt));
  } catch (error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get messages by chat id",
    );
  }
}

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: "up" | "down";
}) {
  try {
    const [existingVote] = await db
      .select()
      .from(vote)
      .where(and(eq(vote.messageId, messageId)));

    if (existingVote) {
      return await db
        .update(vote)
        .set({ isUpvoted: type === "up" })
        .where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId)));
    }
    return await db.insert(vote).values({
      chatId,
      messageId,
      isUpvoted: type === "up",
    });
  } catch (error) {
    throw new ChatSDKError("bad_request:database", "Failed to vote message");
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    return await db.select().from(vote).where(eq(vote.chatId, id));
  } catch (error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get votes by chat id",
    );
  }
}

export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
}) {
  try {
    return await db
      .insert(document)
      .values({
        id,
        title,
        kind,
        content,
        userId,
        createdAt: new Date(),
      })
      .returning();
  } catch (error) {
    throw new ChatSDKError("bad_request:database", "Failed to save document");
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    const documents = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(asc(document.createdAt));

    return documents;
  } catch (error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get documents by id",
    );
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const [selectedDocument] = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt));

    return selectedDocument;
  } catch (error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get document by id",
    );
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    await db
      .delete(suggestion)
      .where(
        and(
          eq(suggestion.documentId, id),
          gt(suggestion.documentCreatedAt, timestamp),
        ),
      );

    return await db
      .delete(document)
      .where(and(eq(document.id, id), gt(document.createdAt, timestamp)))
      .returning();
  } catch (error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete documents by id after timestamp",
    );
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Array<Suggestion>;
}) {
  try {
    return await db.insert(suggestion).values(suggestions);
  } catch (error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to save suggestions",
    );
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    return await db
      .select()
      .from(suggestion)
      .where(and(eq(suggestion.documentId, documentId)));
  } catch (error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get suggestions by document id",
    );
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    return await db.select().from(message).where(eq(message.id, id));
  } catch (error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get message by id",
    );
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    const messagesToDelete = await db
      .select({ id: message.id })
      .from(message)
      .where(
        and(eq(message.chatId, chatId), gte(message.createdAt, timestamp)),
      );

    const messageIds = messagesToDelete.map((message) => message.id);

    if (messageIds.length > 0) {
      await db
        .delete(vote)
        .where(
          and(eq(vote.chatId, chatId), inArray(vote.messageId, messageIds)),
        );

      return await db
        .delete(message)
        .where(
          and(eq(message.chatId, chatId), inArray(message.id, messageIds)),
        );
    }
  } catch (error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete messages by chat id after timestamp",
    );
  }
}

export async function updateChatVisiblityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: "private" | "public";
}) {
  try {
    return await db.update(chat).set({ visibility }).where(eq(chat.id, chatId));
  } catch (error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to update chat visibility by id",
    );
  }
}

export async function updateChatLastContextById({
  chatId,
  context,
}: {
  chatId: string;
  // Store merged server-enriched usage object
  context: AppUsage;
}) {
  try {
    return await db
      .update(chat)
      .set({ lastContext: context })
      .where(eq(chat.id, chatId));
  } catch (error) {
    console.warn("Failed to update lastContext for chat", chatId, error);
    return;
  }
}

export async function getMessageCountByUserId({
  id,
  differenceInHours,
}: {
  id: string;
  differenceInHours: number;
}) {
  try {
    const twentyFourHoursAgo = new Date(
      Date.now() - differenceInHours * 60 * 60 * 1000,
    );

    const [stats] = await db
      .select({ count: count(message.id) })
      .from(message)
      .innerJoin(chat, eq(message.chatId, chat.id))
      .where(
        and(
          eq(chat.userId, id),
          gte(message.createdAt, twentyFourHoursAgo),
          eq(message.role, "user"),
        ),
      )
      .execute();

    return stats?.count ?? 0;
  } catch (error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get message count by user id",
    );
  }
}

export async function createStreamId({
  streamId,
  chatId,
}: {
  streamId: string;
  chatId: string;
}) {
  try {
    await db
      .insert(stream)
      .values({ id: streamId, chatId, createdAt: new Date() });
  } catch (error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to create stream id",
    );
  }
}

export async function getStreamIdsByChatId({ chatId }: { chatId: string }) {
  try {
    const streamIds = await db
      .select({ id: stream.id })
      .from(stream)
      .where(eq(stream.chatId, chatId))
      .orderBy(asc(stream.createdAt))
      .execute();

    return streamIds.map(({ id }) => id);
  } catch (error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get stream ids by chat id",
    );
  }
}

export async function insertResoureces(
  schema: InsertResourceSchema[],
): Promise<Resources[]> {
  try {
    return await db.insert(resources).values(schema);
  } catch (error) {
    throw new ChatSDKError("bad_request:database", "Failed to insert resource");
  }
}

export async function getResources() {
  try {
    return await db
      .select()
      .from(resources)
      .orderBy(asc(resources.createdAt))
      .execute();
  } catch (error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get resource by id",
    );
  }
}

export async function getResourceByID(id: string, userID: string) {
  try {
    return await db
      .select()
      .from(resources)
      .where(eq(resources.id, id))
      .orderBy(asc(resources.createdAt))
      .execute();
  } catch (error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get resource by id",
    );
  }
}

export async function getResourceByNamespaceID(namespaceID: string) {
  try {
    return await db
      .select()
      .from(resources)
      .where(eq(resources.namespaceId, namespaceID))
      .orderBy(asc(resources.createdAt))
      .execute();
  } catch (error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get resource by namespace id",
    );
  }
}

export async function insertEmbedding(
  resourceID: string,
  embeddingContents: Array<EmbeddingContent>,
) {
  try {
    return await db.insert(embeddings).values(
      embeddingContents.map((embedding) => ({
        resourceId: resourceID,
        ...embedding,
      })),
    );
  } catch (error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to insert embedding",
    );
  }
}

// todo namespaceIdがなければ全体からとってくるので、embeddingsが増えると重くなる
export async function findEmbedding(
  userQueryEmbedded: number[],
  namespaceId?: string,
) {
  try {
    const similarity = sql<number>`1 - (${cosineDistance(
      embeddings.embedding,
      userQueryEmbedded,
    )})`;

    const getIDs = async () => {
      if (!namespaceId) {
        return Promise.resolve([]);
      }
      const targets = await db
        .select({ resourceId: resources.id, embeddingId: embeddings.id })
        .from(embeddings)
        .leftJoin(resources, eq(embeddings.resourceId, resources.id))
        .where(eq(resources.namespaceId, namespaceId))
        .execute();
      return (targets || []).map((v) => v.embeddingId);
    };
    const ids = await getIDs();
    console.log("ids", ids);

    const filter = namespaceId
      ? and(gt(similarity, 0.5), inArray(embeddings.id, ids))
      : gt(similarity, 0.5);

    return await db
      .select({ name: embeddings.content, similarity })
      .from(embeddings)
      .where(filter)
      .orderBy((t) => desc(t.similarity))
      .limit(4);
  } catch (error) {
    console.log("error", error);
    throw new ChatSDKError("bad_request:database", "Failed to get embedding");
  }
}

export async function findEmbeddingsByNamespaceId(namespaceId: string) {
  try {
    const targets = db
      .select({ resourceId: resources.id, embeddingId: embeddings.id })
      .from(embeddings)
      .leftJoin(resources, eq(embeddings.resourceId, resources.id))
      .where(eq(resources.namespaceId, namespaceId))
      .execute();
    return targets;
  } catch (error) {
    throw new ChatSDKError("bad_request:database", "Failed to get embedding");
  }
}

export async function insertResorcesAndEmbeddings(
  userId: string,
  namespaceId: string,
  fileIDs: string[],
): Promise<Resources[]> {
  try {
    const result = await db.transaction(async (tx) => {
      const files = fileIDs.map((fileID) => {
        const filename = fileID.split("_")[1];
        const uploadDir = path.join(process.cwd(), uploadFilePath);
        const filePath = path.join(uploadDir, fileID);
        const data = fs.readFileSync(filePath, "utf-8");
        return { name: fileID, content: data, filename: filename };
      });

      const summariesP = files.map((file) => {
        return generateSummary({ input: file.content });
      });
      const summaries = await Promise.all(summariesP);

      const resourcesData: InsertResourceSchema[] = files.map((file, i) => {
        return {
          name: file.filename,
          summary: summaries[i],
          content: file.content,
          namespaceId: namespaceId,
        };
      });

      const newResources: Resources[] = await tx
        .insert(resources)
        .values(resourcesData)
        .returning();
      const insertEmbeddings = newResources.map(async (r: Resources) => {
        const embeddingContents = await generateEmbeddings(r.content);
        return tx.insert(embeddings).values(
          embeddingContents.map((embedding) => ({
            resourceId: r.id,
            ...embedding,
          })),
        );
      });
      const newEmbeddings = await Promise.all(insertEmbeddings);
      return newResources;
    });
    return result;
  } catch (error) {
    console.log("err: ", error);
    throw new ChatSDKError("bad_request:database", "Failed: insertNamespace");
  }
}

const uploadFilePath = "public/files";
export async function insertNamespaceWithResourceAndEmbeddings(
  userId: string,
  fileIDs: string[],
): Promise<NamespaceWithResources> {
  try {
    const result = await db.transaction(async (tx) => {
      const files = fileIDs.map((fileID) => {
        const filename = fileID.split("_")[1];
        const uploadDir = path.join(process.cwd(), uploadFilePath);
        const filePath = path.join(uploadDir, fileID);

        const data = fs.readFileSync(filePath, "utf-8");
        return { name: fileID, content: data, filename: filename };
      });

      const summariesP = files.map((file) => {
        return generateSummary({ input: file.content });
      });
      const summaries = await Promise.all(summariesP);

      const namespaceTitle = await generateTitleForDoc({
        input: summaries.join("\n\n"),
      });

      const [newNamespace] = await tx
        .insert(namespace)
        .values({ name: namespaceTitle, userId })
        .returning();

      const resourcesData: InsertResourceSchema[] = files.map((file, i) => {
        return {
          name: file.filename,
          summary: summaries[i],
          content: file.content,
          namespaceId: newNamespace.id,
        };
      });

      const newResources: Resources[] = await tx
        .insert(resources)
        .values(resourcesData)
        .returning();
      const insertEmbeddings = newResources.map(async (r: Resources) => {
        const embeddingContents = await generateEmbeddings(r.content);
        return tx.insert(embeddings).values(
          embeddingContents.map((embedding) => ({
            resourceId: r.id,
            ...embedding,
          })),
        );
      });
      const newEmbeddings = await Promise.all(insertEmbeddings);
      return { ...newNamespace, resources: newResources };
    });
    return result;
  } catch (error) {
    console.log("err: ", error);
    throw new ChatSDKError("bad_request:database", "Failed: insertNamespace");
  }
}

export async function getNamespaceByID(id: string): Promise<Namespace> {
  try {
    const [result] = await db
      .select()
      .from(namespace)
      .where(eq(namespace.id, id))
      .execute();
    return result;
  } catch (error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get namespace by id",
    );
  }
}

export async function getNamespaceByUserID(
  id: string,
  userId: string,
): Promise<NamespaceWithResources> {
  try {
    const rows = await db
      .select({
        id: namespace.id,
        name: namespace.name,
        userId: namespace.userId,
        createdAt: namespace.createdAt,
        updatedAt: namespace.updatedAt,
        resource_id: resources.id,
        resource_summary: resources.summary,
        resource_name: resources.name,
        resource_content: resources.content,
        resource_createdAt: resources.createdAt,
        resource_updateAt: resources.updatedAt,
      })
      .from(namespace)
      .where(and(eq(namespace.id, id), eq(namespace.userId, userId)))
      .orderBy(asc(namespace.createdAt))
      .leftJoin(resources, eq(namespace.id, resources.namespaceId))
      .execute();

    const map = new Map<string, NamespaceWithResources>();
    for (const row of rows) {
      if (!map.has(row.id)) {
        map.set(row.id, {
          id: id,
          name: row.name,
          userId: row.userId,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          resources: [],
        });
      }
      if (row.id) {
        map.get(row.id)!.resources.push({
          id: row.resource_id!,
          name: row.resource_name!,
          namespaceId: row.id,
          summary: row.resource_summary,
          content: row.resource_content!,
          createdAt: row.resource_createdAt!,
          updatedAt: row.resource_updateAt!,
        });
      }
    }
    return [...map.values()][0];
  } catch (error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get stream ids by chat id",
    );
  }
}

export async function getNamespacesByUserID(
  id: string,
  page: number,
  per_page: number,
) {
  try {
    const offset = (page - 1) * per_page;

    const [stats] = await db
      .select({ count: count(namespace.id) })
      .from(namespace)
      .where(eq(namespace.userId, id));

    const result = await db
      .select()
      .from(namespace)
      .where(eq(namespace.userId, id))
      .orderBy(asc(namespace.createdAt))
      .limit(per_page)
      .offset(offset)
      .execute();
    return [stats?.count ?? 0, result];
  } catch (error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get stream ids by chat id",
    );
  }
}

export async function deleteNamespaceById({ id }: { id: string }) {
  try {
    await db.delete(namespace).where(eq(namespace.id, id));
    await db.delete(resources).where(eq(resources.namespaceId, id));
  } catch (error) {
    console.log("error", error);
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete namespace by id",
    );
  }
}

// export async function insertFile(values: InsertFileSchema[]) {
//   try {
//     return await db.insert(fileTable).values(values).returning();
//   } catch (error) {
//     throw new ChatSDKError("bad_request:database", "Failed to insert file");
//   }
// }
