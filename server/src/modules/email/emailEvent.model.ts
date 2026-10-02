import mongoose, { Document, Model, Schema } from "mongoose";

export interface IEmailEvent extends Document {
  providerMessageId?: string | null;
  messageId: string;
  ticketId?: mongoose.Types.ObjectId | null;
  ticketNumber?: string;
  recipientEmail?: string;
  direction: "inbound" | "outbound";
  subject: string;
  status: "queued" | "sent" | "delivered" | "failed" | "processed";
  error?: string | null;
  processedAt: Date;
  createdAt: Date;
}

const emailEventSchema = new Schema<IEmailEvent>(
  {
    providerMessageId: {
      type: String,
      default: null,
      index: true,
    },
    messageId: {
      type: String,
      required: true,
      index: true,
    },
    ticketId: {
      type: Schema.Types.ObjectId,
      ref: "Ticket",
      default: null,
      index: true,
    },
    ticketNumber: {
      type: String,
      default: "",
      index: true,
    },
    recipientEmail: {
      type: String,
      default: "",
    },
    direction: {
      type: String,
      enum: ["inbound", "outbound"],
      required: true,
      index: true,
    },
    subject: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["queued", "sent", "delivered", "failed", "processed"],
      default: "queued",
    },
    error: {
      type: String,
      default: null,
    },
    processedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

export const EmailEvent: Model<IEmailEvent> = mongoose.model<IEmailEvent>(
  "EmailEvent",
  emailEventSchema,
);
export default EmailEvent;
