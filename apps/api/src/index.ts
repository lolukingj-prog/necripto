import { serve } from "@hono/node-server";
import { Hono } from "hono";

const app = new Hono();

// Healthcheck para CI y despliegue. Sin rutas de negocio en fase 0.
app.get("/health", (c) => c.json({ ok: true, service: "nexora-api" }));

const port = Number(process.env.PORT ?? 3001);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`nexora-api escuchando en http://localhost:${info.port}`);
});
