import express from "express";
import path from "path";
import cors from "cors";
import { serve } from "inngest/express";
import { clerkMiddleware } from "@clerk/express";

import { ENV } from "./lib/env.js";
import { connectDB } from "./lib/db.js";
import { inngest, functions } from "./lib/inngest.js";

import chatRoutes from "./routes/chatRoutes.js";
import sessionRoutes from "./routes/sessionRoute.js";
import problemRoutes from "./routes/problemRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { ensureProblemsSeeded } from "./lib/seedProblems.js";

const app = express();
const __dirname = path.resolve();

// Middleware
app.use(express.json());

// CORS: separate dev vs prod
const allowedOrigins =
  ENV.NODE_ENV === "development"
    ? ["http://localhost:5173"]
    : [ENV.CLIENT_URL].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// Clerk auth middleware
app.use(clerkMiddleware());

// API routes
app.use("/api/inngest", serve({ client: inngest, functions }));
app.use("/api/chat", chatRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/problems", problemRoutes);
app.use("/api/users", userRoutes);

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ msg: "API is up and running" });
});

// Serve frontend in production
if (ENV.NODE_ENV === "production") {
  const frontendPath = path.join(__dirname, "../frontend/dist");
  app.use(express.static(frontendPath));

  // Catch-all route for SPA
  app.get("*", (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
  });
}

// Start server
const startServer = async () => {
  try {
    await connectDB();
    await ensureProblemsSeeded();

    const PORT = process.env.PORT || ENV.PORT || 3000;
    app.listen(PORT, () => console.log(`Server is running on port: ${PORT}`));
  } catch (error) {
    console.error("💥 Error starting the server:", error);
    process.exit(1);
  }
};

startServer();
