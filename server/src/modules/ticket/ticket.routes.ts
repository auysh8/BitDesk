import { Router } from "express";

import {
  createTicket,
  getTickets,
  getTicketById,
  addTicketMessage,
  getTicketMessages,
  assignTicket,
  resolveTicket,
  updateTicket, // <-- add this
  reopenTicket,
  closeTicket,
  getTicketActivity,
} from "./ticket.controller.js";
import { authenticate, authorizeRoles } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import {
  createTicketSchema,
  addMessageSchema,
  assignTicketSchema,
  updateTicketSchema, // <-- add this
} from "./ticket.validator.js";
import { USER_ROLES } from "../../constants/roles.js";

const router = Router();

// All ticket routes require authentication
router.use(authenticate);

// Ticket CRUD & Listing
router.post("/", validate(createTicketSchema), createTicket);
router.get("/", getTickets);
router.get("/:ticketId", getTicketById);
router.patch("/:ticketId", validate(updateTicketSchema), updateTicket);

// Ticket Conversation Thread
router.post(
  "/:ticketId/messages",
  validate(addMessageSchema),
  addTicketMessage,
);
router.get("/:ticketId/messages", getTicketMessages);

// Ticket Lifecycle Actions
router.post(
  "/:ticketId/assign",
  authorizeRoles(USER_ROLES.AGENT, USER_ROLES.ADMIN),
  validate(assignTicketSchema),
  assignTicket,
);
router.post(
  "/:ticketId/resolve",
  authorizeRoles(USER_ROLES.AGENT, USER_ROLES.ADMIN),
  resolveTicket,
);
router.post("/:ticketId/reopen", reopenTicket);
router.post("/:ticketId/close", closeTicket);

// Activity Timeline
router.get("/:ticketId/activity", getTicketActivity);

export default router;
