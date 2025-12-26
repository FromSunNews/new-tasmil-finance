import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  inArray,
  isNull,
  lt,
  type SQL,
} from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import type { ArtifactKind, VisibilityType } from "./schema.js";
import {
  type Chat,
  chat,
  type DBMessage,
  document,
  message,
  type Suggestion,
  stream,
  suggestion,
  type User,
  user,
  vote,
} from "./schema.js";
import { generateHashedPassword, generateUUID } from "./utils.js";

// Database client - should be initialized with connection string
let dbInstance: ReturnType<typeof drizzle> | null = null;

export function initDb(connectionString: string) {
  const client = postgres(connectionString);
  dbInstance = drizzle(client);
  return dbInstance;
}

export function getDb() {
  if (!dbInstance) {
    throw new Error("Database not initialized. Call initDb() first.");
  }
  return dbInstance;
}

export async function getUser(email: string): Promise<User[]> {
  const db = getDb();
  return await db.select().from(user).where(eq(user.email, email));
}

export async function createUser(email: string, password: string) {
  const db = getDb();
  const hashedPassword = generateHashedPassword(password);
  return await db.insert(user).values({ email, password: hashedPassword });
}

export async function createGuestUser(): Promise<User[]> {
  const db = getDb();
  const email = `guest-${Date.now()}`;
  const password = generateHashedPassword(generateUUID());

  return await db.insert(user).values({ email, password }).returning();
}

export async function saveChat({
  id,
  userId,
  title,
  visibility,
  agentId,
}: {
  id: string;
  userId: string;
  title: string;
  visibility: VisibilityType;
  agentId?: string;
}) {
  const db = getDb();
  return await db.insert(chat).values({
    id,
    createdAt: new Date(),
    userId,
    title,
    visibility,
    agentId: agentId || null,
  });
}

export async function deleteChatById({ id }: { id: string }) {
  const db = getDb();
  await db.delete(vote).where(eq(vote.chatId, id));
  await db.delete(message).where(eq(message.chatId, id));
  await db.delete(stream).where(eq(stream.chatId, id));

  const [chatsDeleted] = await db
    .delete(chat)
    .where(eq(chat.id, id))
    .returning();
  return chatsDeleted;
}

export async function deleteAllChatsByUserId({ userId }: { userId: string }) {
  const db = getDb();
  const userChats = await db
    .select({ id: chat.id })
    .from(chat)
    .where(eq(chat.userId, userId));

  if (userChats.length === 0) {
    return { deletedCount: 0 };
  }

  const chatIds = userChats.map((c: { id: string }) => c.id);

  await db.delete(vote).where(inArray(vote.chatId, chatIds));
  await db.delete(message).where(inArray(message.chatId, chatIds));
  await db.delete(stream).where(inArray(stream.chatId, chatIds));

  const deletedChats = await db
    .delete(chat)
    .where(eq(chat.userId, userId))
    .returning();

  return { deletedCount: deletedChats.length };
}

export async function getChatsByUserId({
  id,
  limit,
  startingAfter,
  endingBefore,
  agentId,
}: {
  id: string;
  limit: number;
  startingAfter: string | null;
  endingBefore: string | null;
  agentId?: string | null;
}) {
  const db = getDb();
  const extendedLimit = limit + 1;

  const query = (whereCondition?: SQL<any>) => {
    const conditions = [eq(chat.userId, id)];
    
    // Filter by agentId if provided
    if (agentId !== undefined) {
      if (agentId === null) {
        // Filter for chats without agentId
        conditions.push(isNull(chat.agentId));
      } else {
        // Filter for specific agentId
        conditions.push(eq(chat.agentId, agentId));
      }
    }
    
    return db
      .select()
      .from(chat)
      .where(
        whereCondition
          ? and(whereCondition, ...conditions)
          : and(...conditions)
      )
      .orderBy(desc(chat.createdAt))
      .limit(extendedLimit);
  };

  let filteredChats: Chat[] = [];

  if (startingAfter) {
    const [selectedChat] = await db
      .select()
      .from(chat)
      .where(eq(chat.id, startingAfter))
      .limit(1);

    if (!selectedChat) {
      throw new Error(`Chat with id ${startingAfter} not found`);
    }

    filteredChats = await query(gt(chat.createdAt, selectedChat.createdAt));
  } else if (endingBefore) {
    const [selectedChat] = await db
      .select()
      .from(chat)
      .where(eq(chat.id, endingBefore))
      .limit(1);

    if (!selectedChat) {
      throw new Error(`Chat with id ${endingBefore} not found`);
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
}

export async function getChatById({ id }: { id: string }) {
  const db = getDb();
  const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
  return selectedChat ?? null;
}

export async function saveMessages({ messages }: { messages: DBMessage[] }) {
  const db = getDb();
  return await db.insert(message).values(messages);
}

export async function updateMessage({
  id,
  parts,
}: {
  id: string;
  parts: DBMessage["parts"];
}) {
  const db = getDb();
  return await db.update(message).set({ parts }).where(eq(message.id, id));
}

export async function getMessagesByChatId({ id }: { id: string }) {
  const db = getDb();
  return await db
    .select()
    .from(message)
    .where(eq(message.chatId, id))
    .orderBy(asc(message.createdAt));
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
  const db = getDb();
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
}

export async function getVotesByChatId({ id }: { id: string }) {
  const db = getDb();
  return await db.select().from(vote).where(eq(vote.chatId, id));
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
  const db = getDb();
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
}

export async function getDocumentsById({ id }: { id: string }) {
  const db = getDb();
  const documents = await db
    .select()
    .from(document)
    .where(eq(document.id, id))
    .orderBy(asc(document.createdAt));

  return documents;
}

export async function getDocumentById({ id }: { id: string }) {
  const db = getDb();
  const [selectedDocument] = await db
    .select()
    .from(document)
    .where(eq(document.id, id))
    .orderBy(desc(document.createdAt));

  return selectedDocument ?? null;
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  const db = getDb();
  await db
    .delete(suggestion)
    .where(
      and(
        eq(suggestion.documentId, id),
        gt(suggestion.documentCreatedAt, timestamp)
      )
    );

  return await db
    .delete(document)
    .where(and(eq(document.id, id), gt(document.createdAt, timestamp)))
    .returning();
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Suggestion[];
}) {
  const db = getDb();
  return await db.insert(suggestion).values(suggestions);
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  const db = getDb();
  return await db
    .select()
    .from(suggestion)
    .where(eq(suggestion.documentId, documentId));
}

export async function getMessageById({ id }: { id: string }) {
  const db = getDb();
  const [result] = await db.select().from(message).where(eq(message.id, id));
  return result ?? null;
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  const db = getDb();
  const messagesToDelete = await db
    .select({ id: message.id })
    .from(message)
    .where(
      and(eq(message.chatId, chatId), gte(message.createdAt, timestamp))
    );

  const messageIds = messagesToDelete.map(
    (currentMessage: { id: string }) => currentMessage.id
  );

  if (messageIds.length > 0) {
    await db
      .delete(vote)
      .where(
        and(eq(vote.chatId, chatId), inArray(vote.messageId, messageIds))
      );

    return await db
      .delete(message)
      .where(
        and(eq(message.chatId, chatId), inArray(message.id, messageIds))
      );
  }
}

export async function updateChatVisibilityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: "private" | "public";
}) {
  const db = getDb();
  return await db.update(chat).set({ visibility }).where(eq(chat.id, chatId));
}

export async function updateChatTitleById({
  chatId,
  title,
}: {
  chatId: string;
  title: string;
}) {
  const db = getDb();
  try {
    return await db.update(chat).set({ title }).where(eq(chat.id, chatId));
  } catch (error) {
    console.warn("Failed to update title for chat", chatId, error);
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
  const db = getDb();
  const twentyFourHoursAgo = new Date(
    Date.now() - differenceInHours * 60 * 60 * 1000
  );

  const [stats] = await db
    .select({ count: count(message.id) })
    .from(message)
    .innerJoin(chat, eq(message.chatId, chat.id))
    .where(
      and(
        eq(chat.userId, id),
        gte(message.createdAt, twentyFourHoursAgo),
        eq(message.role, "user")
      )
    )
    .execute();

  return stats?.count ?? 0;
}

export async function createStreamId({
  streamId,
  chatId,
}: {
  streamId: string;
  chatId: string;
}) {
  const db = getDb();
  await db
    .insert(stream)
    .values({ id: streamId, chatId, createdAt: new Date() });
}

export async function getStreamIdsByChatId({ chatId }: { chatId: string }) {
  const db = getDb();
  const streamIds = await db
    .select({ id: stream.id })
    .from(stream)
    .where(eq(stream.chatId, chatId))
    .orderBy(asc(stream.createdAt))
    .execute();

  return streamIds.map(({ id }: { id: string }) => id);
}

