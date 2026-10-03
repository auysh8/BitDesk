// server/src/modules/ticket/ticket.validator.ts
import Joi from "joi";
import {
  TICKET_PRIORITY,
  TICKET_STATUS,
  MESSAGE_TYPE,
} from "../../constants/ticket.js";

const attachmentSchema = Joi.alternatives().try(
  Joi.string(),
  Joi.object({
    filename: Joi.string().required(),
    url: Joi.string().required(),
    size: Joi.number().optional(),
    mimetype: Joi.string().optional(),
  }),
);

export const createTicketSchema = Joi.object({
  subject: Joi.string().trim().min(3).max(200).required().messages({
    "string.empty": "Subject is required",
    "string.min": "Subject must be at least 3 characters",
  }),
  description: Joi.string().trim().min(10).required().messages({
    "string.empty": "Description is required",
    "string.min": "Description must be at least 10 characters",
  }),
  category: Joi.string().required().messages({
    "string.empty": "Category ID is required",
  }),
  priority: Joi.string()
    .valid(...Object.values(TICKET_PRIORITY))
    .default(TICKET_PRIORITY.MEDIUM),
  attachments: Joi.array().items(attachmentSchema).default([]),
});

export const updateTicketSchema = Joi.object({
  priority: Joi.string().valid(...Object.values(TICKET_PRIORITY)),
  category: Joi.string(),
  status: Joi.string().valid(...Object.values(TICKET_STATUS)),
}).min(1);

export const addMessageSchema = Joi.object({
  body: Joi.string().trim().min(1).required().messages({
    "string.empty": "Message body cannot be empty",
  }),
  type: Joi.string()
    .valid(...Object.values(MESSAGE_TYPE))
    .default(MESSAGE_TYPE.PUBLIC),
  attachments: Joi.array().items(attachmentSchema).default([]),
});

export const assignTicketSchema = Joi.object({
  agentId: Joi.string().required().messages({
    "string.empty": "Agent ID is required",
  }),
});
