// server/src/constants/ticket.ts

export const TICKET_STATUS = {
  OPEN: "open",
  IN_PROGRESS: "in_progress",
  PENDING: "pending",
  RESOLVED: "resolved",
  CLOSED: "closed",
  REOPENED: "reopened",
} as const;

export type TicketStatus = (typeof TICKET_STATUS)[keyof typeof TICKET_STATUS];

export const TICKET_PRIORITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  URGENT: "urgent",
} as const;

export type TicketPriority =
  (typeof TICKET_PRIORITY)[keyof typeof TICKET_PRIORITY];

export const MESSAGE_TYPE = {
  PUBLIC: "public",
  INTERNAL: "internal", // Visible only to support staff and admins
} as const;

export type MessageType = (typeof MESSAGE_TYPE)[keyof typeof MESSAGE_TYPE];

export const MESSAGE_SOURCE = {
  WEB: "web",
  EMAIL: "email",
} as const;

export type MessageSource =
  (typeof MESSAGE_SOURCE)[keyof typeof MESSAGE_SOURCE];
