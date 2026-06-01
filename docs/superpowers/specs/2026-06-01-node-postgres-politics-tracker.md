# Architecture Specification: Italian Political Event Tracker (Node.js, Supabase/PostgreSQL, React)

This document serves as the high-fidelity engineering blueprint and implementation guide for building the **Italian Political Event Tracker** from the ground up using a modern, open-source stack.

---

## 1. Project Context & Objectives
- **Target Audience**: Corporate liaison public affairs officer monitoring Italian legislative, regulatory, and political movements.
- **Goal**: Ingest real-time official government acts (Camera, Senato, Openpolis) and media summaries (NewsData.io, Event Registry), store them in a Supabase PostgreSQL database with a 60-day rolling retention window, and serve them to a premium React timeline dashboard.

---

## 2. Tech Stack Definition
- **Database**: Supabase (PostgreSQL with Transaction Pooler)
- **ORM**: Prisma ORM with connection pooling support
- **Backend API Server**: Node.js + Express.js
- **Task Scheduling (Automation)**: `node-cron`
- **Frontend Client**: React (Vite setup, Tailwind CSS styling)

---

## 3. Database Schema & Connection (Supabase & Prisma)

Supabase utilizes PgBouncer for transaction connection pooling. To configure Prisma for Supabase, we define both `DATABASE_URL` (pointing to the connection pooler on port 6543 with `?pgbouncer=true`) and `DIRECT_URL` (connecting directly to port 5432 for schema migrations).

### Prisma Schema (`prisma/schema.prisma`)
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Event {
  id           String          @id @default(uuid())
  title        String
  description  String
  content      String          @db.Text
  date         DateTime        @default(now())
  sourceType   String          // "Official" | "News"
  sourceName   String          // "Dati Camera" | "Dati Senato" | "Openpolis" | "NewsData.io" | "Event Registry"
  sourceUrl    String
  category     String          // "Floor Vote" | "Committee Meeting" | "Political Statement" | "Corporate Regulation" | "Legislative Act"
  impactLevel  String          // "High" | "Medium" | "Low"
  createdAt    DateTime        @default(now())
  updatedAt    DateTime        @updatedAt

  // Relationships
  entities     EventEntities[]
  tags         Tag[]

  @@index([date])
  @@index([sourceType])
  @@index([impactLevel])
}

model Entity {
  id        String          @id @default(uuid())
  name      String          @unique
  party     String          // "FdI" | "PD" | "M5S" | "Lega" | "FI" | "Other"
  role      String
  createdAt DateTime        @default(now())
  updatedAt DateTime        @updatedAt

  // Relationships
  events    EventEntities[]

  @@index([party])
}

// Explicit many-to-many join table mapping events to entities/politicians
model EventEntities {
  eventId  String
  entityId String
  event    Event  @relation(fields: [eventId], references: [id], onDelete: Cascade)
  entity   Entity @relation(fields: [entityId], references: [id], onDelete: Cascade)

  @@id([eventId, entityId])
  @@index([eventId])
  @@index([entityId])
}

model Tag {
  id        String   @id @default(uuid())
  name      String
  eventId   String
  event     Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@unique([name, eventId])
  @@index([name])
}
```

---

## 4. Ingestion Worker Pipeline (`node-cron`)

The ingestion worker queries Dati Camera/Senato, Openpolis, NewsData.io, and Event Registry every 4 hours, normalizes data payloads into standard fields, performs a relational transactional upsert, and deletes any events older than 60 days.

```
                     +---------------------------------------+
                     |         node-cron Trigger             |
                     |       (Every 4 hours / cron)          |
                     +---------------------------------------+
                                         |
                                         v
                     +---------------------------------------+
                     |    1. Fetch APIs concurrently         |
                     | - Camera/Senato SPARQL                |
                     | - Openpolis Movement Logs             |
                     | - NewsData.io / Event Registry        |
                     +---------------------------------------+
                                         |
                                         v
                     +---------------------------------------+
                     |  2. Transformation & Normalization    |
                     |  - Map varying JSON schemas           |
                     |  - Calculate dynamic Impact Level     |
                     |  - Extract tags & political entities  |
                     +---------------------------------------+
                                         |
                                         v
                     +---------------------------------------+
                     |      3. Safe Database Upserts         |
                     | - Prisma dynamic relation connect      |
                     | - Prevent duplicates via key checks   |
                     +---------------------------------------+
                                         |
                                         v
                     +---------------------------------------+
                     |      4. 60-Day Rolling Cleanup        |
                     | - Delete events where date < 60 days  |
                     | - Cascades to join tables automatically|
                     +---------------------------------------+
```

---

## 5. Express API Server Routing

The backend Express application connects to PostgreSQL via Prisma Client, serving paginated and filtered endpoints for events and entities.

### Core Endpoints:
- **`GET /api/events`**: Returns a filtered chronological list of events. Supports:
  - Text search: `q` matching title, description, or tags.
  - Source type: `sourceType` (Official vs News).
  - Date filtering: `days` (rolling depth parameter).
  - Political Party and politician entity filters.
- **`GET /api/entities`**: Returns a checklist of tracked politicians.
- **`POST /api/events/simulate`**: Ingestion simulator to trigger dynamic UI updates on the frontend.

---

## 6. Frontend UI/UX (React + Tailwind)

A highly responsive three-column dashboard styling custom fuchsia glows:
- **Left Column (Filters console)**: Text query input, source checkboxes, category drop-downs, party select pills, and archive range slider.
- **Center Column (Live Stream Timeline)**: Ordered chronological feed of events showing category indicator tags and color-coded impact level alert cards.
- **Right Column (AI Extraction & Corporate Briefing)**: Details pane rendering abstracts, Liaison impact assessments, extracted actor rows, and RDF SPARQL external links.
