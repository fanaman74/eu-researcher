/**
 * Prisma persistence helpers for political events.
 * Shared by the politics-tracker API route and the ingestion pipeline.
 */
import { Prisma, type PrismaClient } from "@prisma/client";
import type { PoliticalEvent } from "./types";
import type { EventPayload } from "./validateEvent";

const EVENT_INCLUDE = {
  tags: true,
  entities: { include: { entity: true } },
} satisfies Prisma.EventInclude;

export type EventWithRelations = Prisma.EventGetPayload<{ include: typeof EVENT_INCLUDE }>;

/** Map a DB row (with relations) to the API-facing PoliticalEvent shape (lib/types.ts). */
export function toPoliticalEvent(event: EventWithRelations): PoliticalEvent {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    content: event.content,
    date: event.date.toISOString(),
    sourceType: event.sourceType as PoliticalEvent["sourceType"],
    sourceName: event.sourceName as PoliticalEvent["sourceName"],
    sourceUrl: event.sourceUrl,
    category: event.category as PoliticalEvent["category"],
    impactLevel: event.impactLevel as PoliticalEvent["impactLevel"],
    entities: event.entities.map((ee) => ({
      name: ee.entity.name,
      role: ee.entity.role,
      party: ee.entity.party as PoliticalEvent["entities"][number]["party"],
    })),
    tags: event.tags.map((t) => t.name),
  };
}

export interface EventFilters {
  q: string;
  sourceType: string;
  category: string;
  party: string;
  daysLimit: number;
}

/** Query events with the same filter semantics the in-memory fallback uses. */
export async function findEvents(
  prisma: PrismaClient,
  { q, sourceType, category, party, daysLimit }: EventFilters
): Promise<PoliticalEvent[]> {
  const where: Prisma.EventWhereInput = {
    date: { gte: new Date(Date.now() - daysLimit * 24 * 60 * 60 * 1000) },
  };
  if (sourceType) where.sourceType = sourceType;
  if (category) where.category = category;
  if (party) where.entities = { some: { entity: { party } } };
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { content: { contains: q, mode: "insensitive" } },
      { tags: { some: { name: { contains: q, mode: "insensitive" } } } },
      { entities: { some: { entity: { name: { contains: q, mode: "insensitive" } } } } },
    ];
  }

  const events = await prisma.event.findMany({
    where,
    include: EVENT_INCLUDE,
    orderBy: { date: "desc" },
  });
  return events.map(toPoliticalEvent);
}

/** Create an event plus its tags and entity associations in one transaction. */
export async function createEventWithRelations(
  prisma: PrismaClient,
  data: EventPayload
): Promise<EventWithRelations> {
  return prisma.$transaction(async (tx) => {
    const event = await tx.event.create({
      data: {
        title: data.title,
        description: data.description,
        content: data.content,
        sourceType: data.sourceType,
        sourceName: data.sourceName,
        sourceUrl: data.sourceUrl,
        category: data.category,
        impactLevel: data.impactLevel,
        ...(data.date ? { date: new Date(data.date) } : {}),
      },
    });

    if (data.tags.length > 0) {
      await tx.tag.createMany({
        data: data.tags.map((name) => ({ name, eventId: event.id })),
      });
    }

    for (const ent of data.entities) {
      const dbEntity = await tx.entity.upsert({
        where: { name: ent.name },
        update: { role: ent.role, party: ent.party },
        create: { name: ent.name, party: ent.party, role: ent.role },
      });
      await tx.eventEntities.create({
        data: { eventId: event.id, entityId: dbEntity.id },
      });
    }

    return tx.event.findUniqueOrThrow({
      where: { id: event.id },
      include: EVENT_INCLUDE,
    });
  });
}

/**
 * Create an event unless a duplicate already exists.
 * News articles carry a stable publication date, so dedupe on title+date;
 * sources with volatile timestamps (mock payloads) dedupe on title only.
 */
export async function createEventIfNew(
  prisma: PrismaClient,
  data: EventPayload,
  { titleOnly = false }: { titleOnly?: boolean } = {}
): Promise<EventWithRelations | null> {
  const existing = await prisma.event.findFirst({
    where: titleOnly
      ? { title: data.title }
      : { title: data.title, date: data.date ? new Date(data.date) : new Date() },
    select: { id: true },
  });
  if (existing) return null;
  return createEventWithRelations(prisma, data);
}

/** Delete events older than the 60-day retention window. Returns rows deleted. */
export async function pruneOldEvents(prisma: PrismaClient): Promise<number> {
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
  const deleted = await prisma.event.deleteMany({ where: { date: { lt: sixtyDaysAgo } } });
  return deleted.count;
}
