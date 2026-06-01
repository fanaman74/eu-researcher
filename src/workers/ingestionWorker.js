const cron = require("node-cron");
const axios = require("axios");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Helper to determine the priority/impact of an event based on key policy concepts
function computeImpactLevel(title, content) {
  const text = `${title} ${content}`.toLowerCase();
  if (text.includes("tariff") || text.includes("tassa") || text.includes("state aid") || text.includes("aiuti di stato")) {
    return "High";
  }
  if (text.includes("commission") || text.includes("governo") || text.includes("decreto")) {
    return "Medium";
  }
  return "Low";
}

// 1. Data Transformation: Normalize Dati Camera SPARQL/RDF response
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

// Core Upsert Function: Prevents duplicates and maintains relational associations
async function upsertPoliticalEvent(normalizedEvent) {
  try {
    const existingEvent = await prisma.event.findFirst({
      where: {
        title: normalizedEvent.title,
        date: normalizedEvent.date
      }
    });

    if (existingEvent) {
      console.log(`[Worker] Event already exists: "${normalizedEvent.title}". Skipping...`);
      return;
    }

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

      if (normalizedEvent.tags && normalizedEvent.tags.length > 0) {
        await tx.tag.createMany({
          data: normalizedEvent.tags.map(t => ({
            name: t,
            eventId: createdEvent.id
          }))
        });
      }

      for (const ent of normalizedEvent.entities) {
        const dbEntity = await tx.entity.upsert({
          where: { name: ent.name },
          update: { role: ent.role, party: ent.party },
          create: { name: ent.name, party: ent.party, role: ent.role }
        });

        await tx.eventEntities.create({
          data: {
            eventId: createdEvent.id,
            entityId: dbEntity.id
          }
        });
      }
    });
    console.log(`[Worker] Upserted event: "${normalizedEvent.title}"`);
  } catch (error) {
    console.error(`[Worker] Failed to upsert event: ${error.message}`);
  }
}

// 60-Day Rolling Data Retention Cleanup Script
async function pruneOldRecords() {
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
  try {
    const deleted = await prisma.event.deleteMany({
      where: {
        date: { lt: sixtyDaysAgo }
      }
    });
    console.log(`[Cleanup] Purged ${deleted.count} historical events older than 60 days.`);
  } catch (error) {
    console.error(`[Cleanup] Failed to execute data retention cleanup: ${error.message}`);
  }
}

async function executeIngestionPipeline() {
  console.log("[Worker] Launching ingestion pipeline fetches...");
  try {
    const mockRdfResponse = [
      {
        titolo: "Voto Camera: Disegno di Legge Tariffario Smart Grid",
        descrizione: "Esenzione fiscale approvata per reti intelligenti e stoccaggi energetici.",
        testoCompleto: "La Camera ha approvato le modifiche sulle Smart Grid inserendo sgravi tariffari per le imprese energivore.",
        data: new Date().toISOString(),
        url: "https://dati.camera.it/votazione/sg-2026",
        politici: [
          { nome: "Matteo Salvini", partito: "Lega", ruolo: "Minister of Infrastructure" }
        ],
        keywords: ["Smart Grid", "Lega", "Tariffario"]
      }
    ];

    for (const rawItem of mockRdfResponse) {
      await upsertPoliticalEvent(transformCameraPayload(rawItem));
    }

    await pruneOldRecords();
  } catch (err) {
    console.error(`[Worker] Ingestion pipe crashed: ${err.message}`);
  }
}

function startIngestionScheduler() {
  console.log("[Scheduler] Initializing node-cron ingestion worker (Interval: Every 4 Hours)...");
  cron.schedule("0 */4 * * *", async () => {
    await executeIngestionPipeline();
  });
}

module.exports = {
  startIngestionScheduler,
  executeIngestionPipeline
};
