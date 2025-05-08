import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import dotenv from "dotenv";
import axios from "axios";
import { spawn } from "child_process";

// Load environment variables from .env file
dotenv.config();

// Log environment variables for debugging
console.log("Environment variables:");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("OPENAI_API_KEY exists:", Boolean(process.env.OPENAI_API_KEY));

// Define the FastAPI backend URL
const FASTAPI_URL = "http://localhost:8000";

// Start FastAPI backend in a separate process
function startFastAPIBackend() {
  try {
    log("Starting FastAPI backend...");
    const fastapi = spawn("python", ["-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"], {
      cwd: "./backend",
      stdio: "inherit",
    });
    
    fastapi.on("close", (code) => {
      log(`FastAPI backend process exited with code ${code}`);
    });
    
    // Return the process so we can handle it later if needed
    return fastapi;
  } catch (error) {
    log(`Error starting FastAPI backend: ${error}`);
    return null;
  }
}

// Start FastAPI backend
const fastapiProcess = startFastAPIBackend();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();
