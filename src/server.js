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

// API Endpoint: GET /api/events (Includes text searching and rolling time filters)
app.get("/api/events", async (req, res, next) => {
  try {
    const { q, sourceType, category, party, days = 60 } = req.query;
    
    const timeLimit = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);
    
    const whereClause = {
      date: { gte: timeLimit },
      ...(sourceType && { sourceType }),
      ...(category && { category }),
      ...(party && {
        entities: {
          some: {
            entity: { party }
          }
        }
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
        entities: {
          include: {
            entity: true
          }
        }
      },
      orderBy: { date: 'desc' }
    });

    res.json({ events });
  } catch (error) {
    next(error);
  }
});

// API Endpoint: GET /api/entities (Fetches all tracked political figures)
app.get("/api/entities", async (req, res, next) => {
  try {
    const entities = await prisma.entity.findMany({
      orderBy: { name: 'asc' }
    });
    res.json({ entities });
  } catch (error) {
    next(error);
  }
});

// API Endpoint: POST /api/events/simulate (Simulates dynamic ingestion of customized event)
app.post("/api/events/simulate", async (req, res, next) => {
  try {
    const { title, description, content, sourceType, sourceName, sourceUrl, category, impactLevel, entities, tags } = req.body;

    const simulatedEvent = await prisma.$transaction(async (tx) => {
      const event = await tx.event.create({
        data: {
          title,
          description,
          content,
          sourceType,
          sourceName,
          sourceUrl: sourceUrl || "https://dati.camera.it",
          category,
          impactLevel,
          date: new Date()
        }
      });

      if (tags && tags.length > 0) {
        await tx.tag.createMany({
          data: tags.map(t => ({ name: t, eventId: event.id }))
        });
      }

      if (entities && entities.length > 0) {
        for (const ent of entities) {
          const dbEnt = await tx.entity.upsert({
            where: { name: ent.name },
            update: { role: ent.role, party: ent.party },
            create: { name: ent.name, party: ent.party, role: ent.role }
          });
          await tx.eventEntities.create({
            data: { eventId: event.id, entityId: dbEnt.id }
          });
        }
      }

      return event;
    });

    res.status(201).json({ success: true, event: simulatedEvent });
  } catch (error) {
    next(error);
  }
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error(`[Error Handler] ${err.stack}`);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error occurred."
  });
});

app.listen(PORT, async () => {
  console.log(`[Express] Dashboard API Server online at http://localhost:${PORT}`);
  
  // Only auto-trigger scheduler if DATABASE_URL doesn't point to placeholder
  if (!process.env.DATABASE_URL.includes("[YOUR_PROJECT_ID]")) {
    startIngestionScheduler();
    try {
      await executeIngestionPipeline();
    } catch (e) {
      console.log("[Express] Skipping initial mock migration due to local db config.");
    }
  } else {
    console.log("[Express] Supabase variables contain placeholders. Poller scheduler paused.");
  }
});
