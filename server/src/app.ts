import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import appConfig from "./config/config.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { ApiError } from "./utils/ApiError.js";
import { sendResponse } from "./utils/apiResponse.js";
import authRoutes from "./modules/auth/auth.routes.js";
import categoryRoutes from "./modules/category/category.routes.js";
import ticketRoutes from "./modules/ticket/ticket.routes.js";
import emailRoutes from "./modules/email/email.routes.js";
import dashboardRoutes from "./modules/dashboard/dashboard.routes.js";
import userRoutes from "./modules/user/user.routes.js";

const app: Application = express();

app.use(helmet());

const configuredOrigins = (appConfig.CORS_ORIGIN || "")
  .split(",")
  .map((o) => o.trim().replace(/\/+$/, ""))
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, postman, server-to-server)
      if (!origin) return callback(null, true);

      const cleanOrigin = origin.replace(/\/+$/, "");

      // Allow configured origins, local development, or any render/vercel preview/production deployment
      if (
        configuredOrigins.includes(cleanOrigin) ||
        cleanOrigin === "http://localhost:5173" ||
        cleanOrigin === "http://localhost:3000" ||
        cleanOrigin.endsWith(".onrender.com") ||
        cleanOrigin.endsWith(".vercel.app")
      ) {
        return callback(null, true);
      }

      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
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

// 1. API Routes
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/users", userRoutes);

// 2. 404 Handler for undefined routes (MUST be after all routes)
app.use((req: Request, _res: Response) => {
  throw new ApiError(
    404,
    `Cannot ${req.method} ${req.originalUrl} - Route Not Found`,
  );
});

// 3. Centralized Error Handler (MUST be last)
app.use(errorHandler);

export default app;
