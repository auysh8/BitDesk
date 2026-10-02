// server/src/modules/ticketActivity/ticketActivity.model.ts
import mongoose, { Document, Model, Schema } from "mongoose";

export interface ITicketActivity extends Document {
  ticketId: mongoose.Types.ObjectId;
  actorId?: mongoose.Types.ObjectId | null;
  actorEmail?: string;
  action: string; // e.g. "TICKET_CREATED", "STATUS_CHANGED", "ASSIGNED", "REPLY_ADDED"
  oldValue?: string | null;
  newValue?: string | null;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const ticketActivitySchema = new Schema<ITicketActivity>(
  {
    ticketId: {
      type: Schema.Types.ObjectId,
      ref: "Ticket",
      required: true,
      index: true,
    },
    actorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    actorEmail: {
      type: String,
      default: "",
    },
    action: {
      type: String,
      required: true,
    },
    oldValue: {
      type: String,
      default: null,
    },
    newValue: {
      type: String,
      default: null,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Activities are immutable historical logs
  },
);

export const TicketActivity: Model<ITicketActivity> =
  mongoose.model<ITicketActivity>("TicketActivity", ticketActivitySchema);
export default TicketActivity;
