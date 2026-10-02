// client/src/pages/tickets/TicketDetail.tsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import axiosClient from "../../api/axiosClient";
import {
  ArrowLeft,
  Send,
  Lock,
  Mail,
  Globe,
  CheckCircle,
  RotateCcw,
  XCircle,
} from "lucide-react";

export const TicketDetail: React.FC = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [ticket, setTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Reply Composer State
  const [replyText, setReplyText] = useState("");
  const [messageType, setMessageType] = useState<"public" | "internal">(
    "public",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTicketData = async () => {
    try {
      const [ticketRes, messagesRes, activityRes] = await Promise.all([
        axiosClient.get(`/tickets/${ticketId}`),
        axiosClient.get(`/tickets/${ticketId}/messages`),
        axiosClient.get(`/tickets/${ticketId}/activity`),
      ]);
      setTicket(ticketRes.data.data);
      setMessages(messagesRes.data.data);
      setActivities(activityRes.data.data);
    } catch (err) {
      console.error("Failed to load ticket details", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicketData();
  }, [ticketId]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setIsSubmitting(true);

    try {
      await axiosClient.post(`/tickets/${ticketId}/messages`, {
        body: replyText,
        type: messageType,
      });
      setReplyText("");
      setMessageType("public");
      await fetchTicketData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to send message");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (action: "resolve" | "reopen" | "close") => {
    try {
      await axiosClient.post(`/tickets/${ticketId}/${action}`);
      await fetchTicketData();
    } catch (err: any) {
      alert(err.response?.data?.message || `Failed to ${action} ticket`);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-sm text-slate-500">
        Loading ticket conversation...
      </div>
    );
  }

  if (!ticket) {
    return <div className="p-8 text-sm text-red-500">Ticket not found.</div>;
  }

  const isStaff = user?.role === "agent" || user?.role === "admin";

  return (
    <div className="space-y-6">
      {/* Back button & Actions Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          onClick={() => navigate("/tickets")}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tickets
        </button>

        {/* Lifecycle Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {ticket.status !== "resolved" &&
            ticket.status !== "closed" &&
            isStaff && (
              <button
                onClick={() => handleStatusChange("resolve")}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
              >
                <CheckCircle className="h-3.5 w-3.5" />
                Resolve
              </button>
            )}

          {(ticket.status === "resolved" || ticket.status === "closed") && (
            <button
              onClick={() => handleStatusChange("reopen")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-purple-300 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-100"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reopen
            </button>
          )}

          {ticket.status !== "closed" && (
            <button
              onClick={() => handleStatusChange("close")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              <XCircle className="h-3.5 w-3.5" />
              Close
            </button>
          )}
        </div>
      </div>

      {/* Ticket Metadata Header Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-sm font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
            {ticket.ticketNumber}
          </span>
          <span className="rounded-md border px-2.5 py-1 text-xs font-semibold uppercase bg-slate-100 text-slate-700">
            {ticket.status.replace("_", " ")}
          </span>
          <span className="rounded-md border px-2.5 py-1 text-xs font-semibold uppercase text-blue-700 bg-blue-50">
            {ticket.priority} priority
          </span>
          <span className="rounded-md border px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-50">
            {ticket.category?.name || "General"}
          </span>
        </div>

        <h1 className="mt-3 text-xl font-bold tracking-tight text-slate-900">
          {ticket.subject}
        </h1>

        <div className="mt-4 flex flex-wrap gap-6 border-t border-slate-100 pt-4 text-xs text-slate-500">
          <div>
            <span className="font-semibold text-slate-700">Requester: </span>
            {ticket.requesterId?.name} ({ticket.requesterEmail})
          </div>
          <div>
            <span className="font-semibold text-slate-700">Assigned To: </span>
            {ticket.assignedTo ? ticket.assignedTo.name : "Unassigned"}
          </div>
          <div>
            <span className="font-semibold text-slate-700">Created: </span>
            {new Date(ticket.createdAt).toLocaleString()}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Conversation Thread (2 Cols) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Messages Stream */}
          <div className="space-y-4">
            {messages.map((msg) => {
              const isInternal = msg.type === "internal";
              const isEmail = msg.source === "email";
              const isAgentOrAdmin =
                msg.senderRole === "agent" || msg.senderRole === "admin";

              return (
                <div
                  key={msg._id}
                  className={`rounded-xl border p-5 transition ${
                    isInternal
                      ? "border-amber-200 bg-amber-50/70"
                      : isAgentOrAdmin
                        ? "border-blue-100 bg-white shadow-xs"
                        : "border-slate-200 bg-slate-50/80"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">
                        {msg.senderId?.name || msg.senderEmail}
                      </span>
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium uppercase text-slate-500">
                        {msg.senderRole}
                      </span>
                      {isInternal && (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 font-semibold text-amber-800">
                          <Lock className="h-3 w-3" />
                          Internal Note
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        {isEmail ? (
                          <Mail className="h-3.5 w-3.5 text-blue-500" />
                        ) : (
                          <Globe className="h-3.5 w-3.5" />
                        )}
                        {isEmail ? "Email" : "Web"}
                      </span>
                      <span>•</span>
                      <span>
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
                    {msg.body}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Reply Composer Form */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <form onSubmit={handleSendReply} className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-slate-500">
                  Add Reply
                </span>

                {/* Internal Note Toggle (Staff Only) */}
                {isStaff && (
                  <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => setMessageType("public")}
                      className={`rounded-md px-3 py-1 transition ${
                        messageType === "public"
                          ? "bg-white text-blue-700 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Public Reply
                    </button>
                    <button
                      type="button"
                      onClick={() => setMessageType("internal")}
                      className={`inline-flex items-center gap-1 rounded-md px-3 py-1 transition ${
                        messageType === "internal"
                          ? "bg-amber-500 text-white shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <Lock className="h-3 w-3" />
                      Internal Note
                    </button>
                  </div>
                )}
              </div>

              <textarea
                required
                rows={4}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={
                  messageType === "internal"
                    ? "Write an internal note (only visible to support agents and admins)..."
                    : "Type your reply to the customer..."
                }
                className={`w-full rounded-lg border p-3 text-sm focus:outline-none ${
                  messageType === "internal"
                    ? "border-amber-300 bg-amber-50/30 focus:border-amber-500"
                    : "border-slate-300 focus:border-blue-600"
                }`}
              />

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`inline-flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-50 ${
                    messageType === "internal"
                      ? "bg-amber-600 hover:bg-amber-700"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  <Send className="h-4 w-4" />
                  {isSubmitting
                    ? "Sending..."
                    : messageType === "internal"
                      ? "Add Note"
                      : "Send Reply"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Activity Timeline (1 Col) */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs h-fit space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Ticket Timeline
          </h2>
          <div className="space-y-4">
            {activities.map((act) => (
              <div
                key={act._id}
                className="relative pl-6 text-xs before:absolute before:left-2 before:top-2 before:h-full before:w-px before:bg-slate-200 last:before:hidden"
              >
                <div className="absolute left-0 top-1 h-4 w-4 rounded-full border border-white bg-blue-600" />
                <p className="font-semibold text-slate-800">{act.action}</p>
                {act.newValue && (
                  <p className="mt-0.5 text-slate-600 font-mono truncate">
                    {act.newValue}
                  </p>
                )}
                <span className="text-[10px] text-slate-400">
                  {new Date(act.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetail;
