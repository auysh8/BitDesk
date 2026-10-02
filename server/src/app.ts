import express, { type Application, type Request, type Response } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import appConfig from "./config/config.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { ApiError } from "./utils/ApiError.js";
import { sendResponse } from "./utils/apiResponse.js";

const app: Application = express();

app.use(helmet());

app.use(
  cors({
    origin: appConfig.CORS_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

app.use(cookieParser());

app.get("/api/health", (_req: Request, res: Response) => {
  return sendResponse(res, 200, "BitDesk API is running smoothly", {
    status: "healthy",
    timestamp: new Date().toISOString(),
    environment: appConfig.NODE_ENV,
  });
});

app.use((req: Request, _res: Response) => {
  throw new ApiError(404, `Cannot ${req.method} ${req.originalUrl} - Route Not Found`);
});

app.use(errorHandler);

export default app;