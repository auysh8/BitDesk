// server/src/modules/ticket/ticket.model.ts
import mongoose, { Document, Model, Schema } from "mongoose";
import {
  TICKET_STATUS,
  TICKET_PRIORITY,
  type TicketStatus,
  type TicketPriority,
} from "../../constants/ticket.js";

export interface ITicket extends Document {
  ticketNumber: string;
  subject: string;
  description: string;
  requesterId: mongoose.Types.ObjectId;
  requesterEmail: string;
  assignedTo?: mongoose.Types.ObjectId | null;
  assignedAt?: Date | null;
  category: mongoose.Types.ObjectId;
  priority: TicketPriority;
  status: TicketStatus;
  attachments?: any[];
  lastMessageAt: Date;
  resolvedAt?: Date | null;
  closedAt?: Date | null;
  reopenedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const ticketSchema = new Schema<ITicket>(
  {
    ticketNumber: {
      type: String,
      unique: true,
      index: true,
    },
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
      maxlength: [200, "Subject cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    requesterId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Requester ID is required"],
      index: true,
    },
    requesterEmail: {
      type: String,
      required: [true, "Requester email is required"],
      lowercase: true,
      trim: true,
      index: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    assignedAt: {
      type: Date,
      default: null,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
      index: true,
    },
    priority: {
      type: String,
      enum: Object.values(TICKET_PRIORITY),
      default: TICKET_PRIORITY.MEDIUM,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(TICKET_STATUS),
      default: TICKET_STATUS.OPEN,
      index: true,
    },
    attachments: {
      type: Schema.Types.Mixed,
      default: [],
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    closedAt: {
      type: Date,
      default: null,
    },
    reopenedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Auto-generate human-readable ticket number (e.g. TKT-2026-000001) before saving
ticketSchema.pre("save", async function () {
  if (this.isNew && !this.ticketNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model("Ticket").countDocuments();
    const sequence = String(count + 1).padStart(6, "0");
    this.ticketNumber = `TKT-${year}-${sequence}`;
  }
});

export const Ticket: Model<ITicket> = mongoose.model<ITicket>(
  "Ticket",
  ticketSchema,
);
export default Ticket;
