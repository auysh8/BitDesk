// server/src/modules/email/email.routes.ts
import { Router } from "express";
import { handleInboundEmail } from "./email.controller.js";

const router = Router();

// Inbound email webhook endpoint (called by email provider or local bridge)
router.post("/inbound", handleInboundEmail);

export default router;
