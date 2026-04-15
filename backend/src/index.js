// import dotenv from "dotenv";
// dotenv.config();

// import express from "express";
// import cors from "cors";
// import cookieParser from "cookie-parser";
// import path from "path";
// import { fileURLToPath } from "url";
// import connectDB from "./db/index.js";
// import authRoutes from "./routes/auth.routes.js";

// const app = express();
// const PORT = process.env.PORT || 5000;

// // ─── Resolve __dirname (required for ESM modules) ────────────────────────────
// const __filename = fileURLToPath(import.meta.url);
// const __dirname  = path.dirname(__filename);

// // ─── Frontend path (csrp/frontend/) ──────────────────────────────────────────
// // backend/src/index.js → go up 2 levels → csrp root → frontend/
// const frontendPath = path.resolve(__dirname, "../../frontend");

// // ─── Middleware ───────────────────────────────────────────────────────────────
// app.use(cors({
//   origin: (origin, callback) => {
//     // Allow requests with no origin (like mobile apps or curl requests)
//     if (!origin) return callback(null, true);
    
//     const allowedPatterns = [
//       /^http:\/\/localhost:\d+$/,
//       /^http:\/\/127\.0\.0\.1:\d+$/,
//       process.env.CORS_ORIGIN
//     ];

//     const isAllowed = allowedPatterns.some(pattern => {
//       if (pattern instanceof RegExp) return pattern.test(origin);
//       return pattern === origin;
//     });

//     if (isAllowed) {
//       callback(null, true);
//     } else {
//       callback(null, true); // Fallback to true in dev for easier debugging, or change to error in prod
//     }
//   },
//   credentials: true,
// }));
// app.use(express.json({ limit: "16kb" }));
// app.use(express.urlencoded({ extended: true, limit: "16kb" }));
// app.use(cookieParser());

// // ─── Serve Frontend Static Files ─────────────────────────────────────────────
// app.use(express.static(frontendPath));

// // ─── Root → Main Page (Auth + Dashboard) ──────────────────────────────────────
// app.get("/", (req, res) => {
//   res.sendFile(path.join(frontendPath, "index.html"));
// });

// // ─── API Routes ───────────────────────────────────────────────────────────────
// app.use("/api/auth", authRoutes);

// // ─── Health Check ─────────────────────────────────────────────────────────────
// app.get("/api/health", (req, res) => {
//   res.json({ status: "ok", message: "CSRP API is running" });
// });

// // ─── Catch-all: unknown routes return 404 JSON ───────────────────────────────
// app.use("/api/*", (req, res) => {
//   res.status(404).json({ success: false, message: "API route not found" });
// });

// // ─── Global Error Handler ─────────────────────────────────────────────────────
// app.use((err, req, res, next) => {
//   const statusCode = err.statusCode || 500;
//   const message    = err.message || "Internal Server Error";
//   res.status(statusCode).json({
//     success: false,
//     statusCode,
//     message,
//     errors: err.errors || [],
//   });
// });

// // ─── Start Server ─────────────────────────────────────────────────────────────
// connectDB().then(() => {
//   app.listen(PORT, () => {
//     console.log(`\n✅  Server running  →  http://localhost:${PORT}`);
//     console.log(`🔑  Login page     →  http://localhost:${PORT}/`);
//     console.log(`⚙️   API base       →  http://localhost:${PORT}/api`);



import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./db/index.js";
import authRoutes from "./routes/auth.routes.js";

const app = express();
const PORT = process.env.PORT || 5000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendPath = path.resolve(__dirname, "../../frontend");

const defaultAllowedOrigins = [
  /^http:\/\/localhost:\d+$/,
  /^http:\/\/127\.0\.0\.1:\d+$/,
];

const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      const isAllowed =
        defaultAllowedOrigins.some((pattern) => pattern.test(origin)) ||
        allowedOrigins.includes(origin);

      if (!isAllowed) {
        callback(new Error(`CORS blocked for origin: ${origin}`));
        return;
      }

      callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());
app.use(express.static(frontendPath));

app.get("/", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

app.use("/api/auth", authRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "CSRP API is running" });
});

app.use("/api/*", (req, res) => {
  res.status(404).json({ success: false, message: "API route not found" });
});

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errors: err.errors || [],
  });
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\nServer running -> http://localhost:${PORT}`);
    console.log(`Frontend     -> http://localhost:${PORT}/`);
    console.log(`API base     -> http://localhost:${PORT}/api`);
  });
});
//   });
// });
