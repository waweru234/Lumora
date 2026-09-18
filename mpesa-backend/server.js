import express from "express";
import cors from "cors";
import mpesaRouter from "./src/routes/mpesa.js";
import { server, env } from "./src/utils/config.js";

const app = express();

app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));

const allowList = new Set(server.allowedOrigins);
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (allowList.size === 0 || allowList.has(origin)) return cb(null, true);
      cb(new Error(`CORS: origin ${origin} not allowed`));
    },
  })
);

app.get("/health", (_req, res) => res.json({ ok: true, env, time: new Date().toISOString() }));
app.use("/api/mpesa", mpesaRouter);

app.use((err, _req, res, _next) => {
  console.error("[error]", err.message);
  res.status(500).json({ ok: false, error: err.message });
});

app.listen(server.port, () => {
  console.log(`M-Pesa backend (env=${env}) listening on http://localhost:${server.port}`);
});
