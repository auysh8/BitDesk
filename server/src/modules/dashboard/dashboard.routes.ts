// server/src/modules/dashboard/dashboard.routes.ts
import { Router } from "express";
import { getDashboardSummary } from "./dashboard.controller.js";
import { authenticate } from "../../middleware/auth.js";

const router = Router();

router.get("/summary", authenticate, getDashboardSummary);

export default router;
