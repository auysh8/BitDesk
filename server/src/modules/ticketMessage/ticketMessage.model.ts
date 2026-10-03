// server/src/modules/ticketMessage/ticketMessage.model.ts
import mongoose, { Document, Model, Schema } from "mongoose";
import {
  MESSAGE_TYPE,
  MESSAGE_SOURCE,
  type MessageType,
  type MessageSource,
} from "../../constants/ticket.js";
import type { UserRole } from "../../constants/roles.js";

export interface ITicketMessage extends Document {
  ticketId: mongoose.Types.ObjectId;
  senderId?: mongoose.Types.ObjectId | null;
  senderEmail: string;
  senderRole: UserRole;
  type: MessageType; // "public" or "internal"
  body: string;
  attachments: any[];
  source: MessageSource; // "web" or "email"
  emailMessageId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const ticketMessageSchema = new Schema<ITicketMessage>(
  {
    ticketId: {
      type: Schema.Types.ObjectId,
      ref: "Ticket",
      required: [true, "Ticket ID is required"],
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    senderEmail: {
      type: String,
      required: [true, "Sender email is required"],
      lowercase: true,
      trim: true,
    },
    senderRole: {
      type: String,
      required: [true, "Sender role is required"],
    },
    type: {
      type: String,
      enum: Object.values(MESSAGE_TYPE),
      default: MESSAGE_TYPE.PUBLIC,
    },
    body: {
      type: String,
      required: [true, "Message body cannot be empty"],
      trim: true,
    },
    attachments: {
      type: Schema.Types.Mixed,
      default: [],
    },
    source: {
      type: String,
      enum: Object.values(MESSAGE_SOURCE),
      default: MESSAGE_SOURCE.WEB,
    },
    emailMessageId: {
      type: String,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

export const TicketMessage: Model<ITicketMessage> =
  mongoose.model<ITicketMessage>("TicketMessage", ticketMessageSchema);
export default TicketMessage;
