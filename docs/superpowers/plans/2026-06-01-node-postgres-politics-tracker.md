# Italian Political Event Tracker (Node.js & Supabase) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a robust, scalable Italian Political Event Tracker from the ground up featuring an Express backend with scheduled API polling, a Supabase-hosted PostgreSQL database using Prisma, and a premium React timeline dashboard.

**Architecture:** We will set up a dedicated Node.js/Express backend server that schedules regular cron scrapers using `node-cron` to normalize Camera/Senato, Openpolis, and news feeds, transactionally upserting them into a Supabase PostgreSQL instance via Prisma client. The React client connects to these Express endpoints, displaying a filterable stream timeline, and details drawer.

**Tech Stack:** Node.js, Express.js, Prisma ORM, Supabase (PostgreSQL), Vite, React, Tailwind CSS.

---

### Task 1: Setup PostgreSQL Database (Supabase & Prisma)

**Files:**
- Create: `prisma/schema.prisma`
- Create: `.env`

- [ ] **Step 1: Install database dependencies and initialize Prisma**

Run:
```bash
npm install prisma @prisma/client
npx prisma init
```

- [ ] **Step 2: Define Prisma Schema supporting Supabase pooling**

Create `prisma/schema.prisma` with relational mapping, tags, and transaction-safe join tables:

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
  sourceType   String          
  sourceName   String          
  sourceUrl    String
  category     String          
  impactLevel  String          
  createdAt    DateTime        @default(now())
  updatedAt    DateTime        @updatedAt

  entities     EventEntities[]
  tags         Tag[]

  @@index([date])
  @@index([sourceType])
  @@index([impactLevel])
}

model Entity {
  id        String          @id @default(uuid())
  name      String          @unique
  party     String          
  role      String
  createdAt DateTime        @default(now())
  updatedAt DateTime        @updatedAt

  events    EventEntities[]

  @@index([party])
}

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

- [ ] **Step 3: Define Supabase Connection strings inside `.env`**

Write your variables to `.env`:
```ini
DATABASE_URL="postgres://postgres.[YOUR_PROJECT_ID]:[YOUR_PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgres://postgres.[YOUR_PROJECT_ID]:[YOUR_PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
```

- [ ] **Step 4: Execute database migration**

Run:
```bash
npx prisma migrate dev --name init
```
Expected: Prisma successfully compiles schema, hooks up to Supabase direct port, and applies table structures.

---

### Task 2: Build Node.js Ingestion Worker Logic (`node-cron`)

**Files:**
- Create: `src/workers/ingestionWorker.js`

- [ ] **Step 1: Install polling and scheduler packages**

Run:
```bash
npm install node-cron axios
```

- [ ] **Step 2: Create worker code normalizing API scrapers**

Write `src/workers/ingestionWorker.js`:

```javascript
const cron = require("node-cron");
const axios = require("axios");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function computeImpactLevel(title, content) {
  const text = `${title} ${content}`.toLowerCase();
  if (text.includes("tariff") || text.includes("tassa") || text.includes("state aid")) return "High";
  if (text.includes("governo") || text.includes("decreto")) return "Medium";
  return "Low";
}

function transformCameraPayload(rdfItem) {
  return {
    title: `Chamber Floor Vote: ${rdfItem.titolo || "Legislative Act"}`,
    description: rdfItem.descrizione || "No description provided.",
    content: rdfItem.testoCompleto || rdfItem.descrizione || "",
    sourceType: "Official",
    sourceName: "Dati Camera",
    sourceUrl: rdfItem.url || "https://dati.camera.it",
    category: "Floor Vote",
    impactLevel: computeImpactLevel(rdfItem.titolo, rdfItem.testoCompleto),
    date: rdfItem.data ? new Date(rdfItem.data) : new Date(),
    entities: rdfItem.politici ? rdfItem.politici.map(p => ({
      name: p.nome,
      party: p.partito || "Other",
      role: p.ruolo || "Deputato"
    })) : [],
    tags: rdfItem.keywords || ["Camera"]
  };
}

async function upsertPoliticalEvent(normalizedEvent) {
  try {
    const existingEvent = await prisma.event.findFirst({
      where: { title: normalizedEvent.title, date: normalizedEvent.date }
    });
    if (existingEvent) return;

    await prisma.$transaction(async (tx) => {
      const createdEvent = await tx.event.create({
        data: {
          title: normalizedEvent.title,
          description: normalizedEvent.description,
          content: normalizedEvent.content,
          sourceType: normalizedEvent.sourceType,
          sourceName: normalizedEvent.sourceName,
          sourceUrl: normalizedEvent.sourceUrl,
          category: normalizedEvent.category,
          impactLevel: normalizedEvent.impactLevel,
          date: normalizedEvent.date,
        }
      });

      if (normalizedEvent.tags?.length > 0) {
        await tx.tag.createMany({
          data: normalizedEvent.tags.map(t => ({ name: t, eventId: createdEvent.id }))
        });
      }

      for (const ent of normalizedEvent.entities) {
        const dbEntity = await tx.entity.upsert({
          where: { name: ent.name },
          update: { role: ent.role, party: ent.party },
          create: { name: ent.name, party: ent.party, role: ent.role }
        });
        await tx.eventEntities.create({
          data: { eventId: createdEvent.id, entityId: dbEntity.id }
        });
      }
    });
  } catch (error) {
    console.error(`[Worker] Error: ${error.message}`);
  }
}

async function pruneOldRecords() {
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
  await prisma.event.deleteMany({ where: { date: { lt: sixtyDaysAgo } } });
}

async function executeIngestionPipeline() {
  const mockRdfResponse = [{
    titolo: "Voto Camera: Disegno di Legge Tariffario Smart Grid",
    descrizione: "Esenzione fiscale approvata per reti intelligenti e stoccaggi energetici.",
    testoCompleto: "La Camera ha approvato le modifiche sulle Smart Grid inserendo sgravi tariffari per le imprese energivore.",
    data: new Date().toISOString(),
    url: "https://dati.camera.it/votazione/sg-2026",
    politici: [{ nome: "Matteo Salvini", partito: "Lega", ruolo: "Minister of Infrastructure" }],
    keywords: ["Smart Grid", "Lega", "Tariffario"]
  }];
  for (const rawItem of mockRdfResponse) {
    await upsertPoliticalEvent(transformCameraPayload(rawItem));
  }
  await pruneOldRecords();
}

function startIngestionScheduler() {
  cron.schedule("0 */4 * * *", async () => {
    await executeIngestionPipeline();
  });
}

module.exports = { startIngestionScheduler, executeIngestionPipeline };
```

---

### Task 3: Build Express Server & API Routes

**Files:**
- Create: `src/server.js`

- [ ] **Step 1: Install server packages**

Run:
```bash
npm install express cors dotenv morgan helmet
```

- [ ] **Step 2: Implement server routing with query filters**

Write `src/server.js`:

```javascript
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { PrismaClient } = require("@prisma/client");
const { startIngestionScheduler, executeIngestionPipeline } = require("./workers/ingestionWorker");

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

app.get("/api/events", async (req, res, next) => {
  try {
    const { q, sourceType, category, party, days = 60 } = req.query;
    const timeLimit = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);
    
    const whereClause = {
      date: { gte: timeLimit },
      ...(sourceType && { sourceType }),
      ...(category && { category }),
      ...(party && {
        entities: { some: { entity: { party } } }
      }),
      ...(q && {
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { content: { contains: q, mode: 'insensitive' } },
          { tags: { some: { name: { contains: q, mode: 'insensitive' } } } },
          { entities: { some: { entity: { name: { contains: q, mode: 'insensitive' } } } } }
        ]
      })
    };

    const events = await prisma.event.findMany({
      where: whereClause,
      include: {
        tags: true,
        entities: { include: { entity: true } }
      },
      orderBy: { date: 'desc' }
    });
    res.json({ events });
  } catch (error) {
    next(error);
  }
});

app.post("/api/events/simulate", async (req, res, next) => {
  try {
    const { title, description, content, sourceType, sourceName, sourceUrl, category, impactLevel, entities, tags } = req.body;
    const simulatedEvent = await prisma.$transaction(async (tx) => {
      const event = await tx.event.create({
        data: { title, description, content, sourceType, sourceName, sourceUrl, category, impactLevel, date: new Date() }
      });
      if (tags?.length > 0) {
        await tx.tag.createMany({ data: tags.map(t => ({ name: t, eventId: event.id })) });
      }
      if (entities?.length > 0) {
        for (const ent of entities) {
          const dbEnt = await tx.entity.upsert({
            where: { name: ent.name },
            update: { role: ent.role, party: ent.party },
            create: { name: ent.name, party: ent.party, role: ent.role }
          });
          await tx.eventEntities.create({ data: { eventId: event.id, entityId: dbEnt.id } });
        }
      }
      return event;
    });
    res.status(201).json({ success: true, event: simulatedEvent });
  } catch (error) {
    next(error);
  }
});

app.listen(PORT, async () => {
  console.log(`[Express] Dashboard API online at http://localhost:${PORT}`);
  startIngestionScheduler();
  await executeIngestionPipeline();
});
```

---

### Task 4: Setup React client and timelines

**Files:**
- Create: `client/src/hooks/usePoliticalEvents.ts`
- Create: `client/src/App.tsx`

- [ ] **Step 1: Create React hooks and interfaces**

Write `client/src/hooks/usePoliticalEvents.ts` as detailed in Step 4.

- [ ] **Step 2: Create App.tsx timeline views**

Write `client/src/App.tsx` as detailed in Step 5.

- [ ] **Step 3: Compile client production build**

Run:
```bash
npm run build
```
Expected: React client compiles successfully.
