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
  Clock,
  PlayCircle,
  FileText,
  Trash2,
  Download,
} from "lucide-react";
import { MarkdownRenderer } from "../../components/common/MarkdownRenderer";
import { RichTextEditor } from "../../components/common/RichTextEditor";
import {
  getSocket,
  joinTicketRoom,
  leaveTicketRoom,
} from "../../api/socket";

export const TicketDetail: React.FC = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [ticket, setTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const isAdmin = user?.role === "admin";
  const isAgent = user?.role === "agent";
  const isStaff = isAdmin || isAgent;
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);

  const [replyText, setReplyText] = useState("");
  const [messageType, setMessageType] = useState<"public" | "internal">(
    "public",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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
    if (isAdmin) {
      axiosClient
        .get("/users/staff")
        .then((res) => setStaffMembers(res.data.data || []))
        .catch((err) => console.error("Failed to load staff members", err));
    }

    if (ticketId) {
      joinTicketRoom(ticketId);
      const socket = getSocket();

      const onMessage = (newMsg: any) => {
        setMessages((prev) => {
          if (prev.some((m) => m._id === newMsg._id)) return prev;
          return [...prev, newMsg];
        });
      };

      const onStatus = (data: any) => {
        if (data.ticket) {
          setTicket((prev: any) => ({ ...prev, ...data.ticket }));
        }
        axiosClient
          .get(`/tickets/${ticketId}/activity`)
          .then((res) => setActivities(res.data.data || []))
          .catch(() => {});
      };

      const onAssign = (data: any) => {
        if (data.ticket) {
          setTicket((prev: any) => ({ ...prev, ...data.ticket }));
        }
        axiosClient
          .get(`/tickets/${ticketId}/activity`)
          .then((res) => setActivities(res.data.data || []))
          .catch(() => {});
      };

      socket.on("ticket:message_created", onMessage);
      socket.on("ticket:status_changed", onStatus);
      socket.on("ticket:assigned", onAssign);

      return () => {
        leaveTicketRoom(ticketId);
        socket.off("ticket:message_created", onMessage);
        socket.off("ticket:status_changed", onStatus);
        socket.off("ticket:assigned", onAssign);
      };
    }
  }, [ticketId, isAdmin]);

  const canReplyPublicly =
    isAdmin ||
    !ticket?.assignedTo ||
    ticket?.assignedTo?._id === user?._id ||
    user?.role === "customer";

  useEffect(() => {
    if (ticket && isStaff && !canReplyPublicly && messageType === "public") {
      setMessageType("internal");
    }
  }, [ticket, isStaff, canReplyPublicly, messageType]);

  const handleAssignTicket = async (agentId: string) => {
    if (!agentId) return;
    setIsAssigning(true);
    try {
      await axiosClient.post(`/tickets/${ticketId}/assign`, { agentId });
      await fetchTicketData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to assign ticket");
    } finally {
      setIsAssigning(false);
    }
  };



  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }

    try {
      const res = await axiosClient.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const uploadedFiles = res.data.data.files || [res.data.data.attachment];
      setAttachments((prev) => [...prev, ...uploadedFiles]);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to upload file");
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = "";
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() && attachments.length === 0) return;
    setIsSubmitting(true);

    const actualType = !canReplyPublicly && isStaff ? "internal" : messageType;

    try {
      await axiosClient.post(`/tickets/${ticketId}/messages`, {
        body: replyText || "(Attached files)",
        type: actualType,
        attachments,
      });
      setReplyText("");
      setAttachments([]);
      setMessageType(canReplyPublicly ? "public" : "internal");
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

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      await axiosClient.patch(`/tickets/${ticketId}`, { status: newStatus });
      await fetchTicketData();
    } catch (err: any) {
      alert(err.response?.data?.message || `Failed to update status`);
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
          {/* Quick Status Changers for Staff */}
          {isStaff &&
            ticket.status !== "resolved" &&
            ticket.status !== "closed" && (
              <>
                {ticket.status !== "in_progress" && (
                  <button
                    onClick={() => handleUpdateStatus("in_progress")}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50/80 px-3.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 shadow-2xs transition-colors"
                  >
                    <PlayCircle className="h-3.5 w-3.5" />
                    In Progress
                  </button>
                )}
                {ticket.status !== "pending" && (
                  <button
                    onClick={() => handleUpdateStatus("pending")}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50/80 px-3.5 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 shadow-2xs transition-colors"
                  >
                    <Clock className="h-3.5 w-3.5" />
                    Pending
                  </button>
                )}
              </>
            )}

          {ticket.status !== "resolved" &&
            ticket.status !== "closed" &&
            isStaff && (
              <button
                onClick={() => handleStatusChange("resolve")}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50/80 px-3.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 shadow-2xs transition-colors"
              >
                <CheckCircle className="h-3.5 w-3.5" />
                Resolve
              </button>
            )}

          {(ticket.status === "resolved" || ticket.status === "closed") && (
            <button
              onClick={() => handleStatusChange("reopen")}
              className="inline-flex items-center gap-1.5 rounded-xl bg-purple-50/80 px-3.5 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-100 shadow-2xs transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reopen
            </button>
          )}

          {ticket.status !== "closed" && (
            <button
              onClick={() => handleStatusChange("close")}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 shadow-2xs transition-colors"
            >
              <XCircle className="h-3.5 w-3.5" />
              Close
            </button>
          )}
        </div>
      </div>

      {/* Ticket Metadata Header Card */}
      <div className="rounded-2xl bg-white p-6 shadow-sm border-0">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="font-mono text-sm font-bold text-blue-600 bg-blue-50/80 px-2.5 py-1 rounded-xl">
            {ticket.ticketNumber}
          </span>
          <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase bg-slate-100 text-slate-700">
            {ticket.status.replace("_", " ")}
          </span>
          <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase text-blue-700 bg-blue-50">
            {ticket.priority} priority
          </span>
          <span className="rounded-full px-2.5 py-0.5 text-xs font-medium text-slate-600 bg-slate-100/80">
            {ticket.category?.name || "General"}
          </span>
        </div>

        <h1 className="mt-3 text-xl font-bold tracking-tight text-slate-900">
          {ticket.subject}
        </h1>

        <div className="mt-5 flex flex-wrap items-center gap-6 bg-slate-50/80 -mx-6 -mb-6 p-5 rounded-b-2xl text-xs text-slate-500">
          <div>
            <span className="font-semibold text-slate-700">Requester: </span>
            {ticket.requesterId?.name} ({ticket.requesterEmail})
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-700">Assigned To: </span>
            {isAdmin ? (
              /* Admin: Full Reassign Dropdown + Quick Assign to Me */
              <div className="flex items-center gap-2">
                <select
                  value={ticket.assignedTo?._id || ""}
                  onChange={(e) => handleAssignTicket(e.target.value)}
                  disabled={isAssigning}
                  className="rounded-xl bg-white py-1.5 px-3 text-xs font-medium text-slate-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 border-0 disabled:opacity-50"
                >
                  <option value="" disabled>
                    {ticket.assignedTo ? "Reassign to..." : "Select Assignee..."}
                  </option>
                  {staffMembers.map((staff) => (
                    <option key={staff._id} value={staff._id}>
                      {staff.name} ({staff.role})
                    </option>
                  ))}
                </select>

                {ticket.assignedTo?._id !== user?._id && (
                  <button
                    onClick={() => handleAssignTicket(user!._id)}
                    disabled={isAssigning}
                    className="rounded-xl bg-blue-100/80 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 shadow-2xs disabled:opacity-50 transition-colors border-0"
                  >
                    Assign to Me
                  </button>
                )}
              </div>
            ) : isAgent ? (
              /* Agent: Claim unassigned ticket OR see who owns it */
              <div className="flex items-center gap-2">
                {!ticket.assignedTo ? (
                  <>
                    <span className="text-amber-600 font-medium">Unassigned</span>
                    <button
                      onClick={() => handleAssignTicket(user!._id)}
                      disabled={isAssigning}
                      className="rounded-xl bg-emerald-100/80 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 shadow-2xs disabled:opacity-50 transition-colors border-0"
                    >
                      {isAssigning ? "Claiming..." : "Claim Ticket"}
                    </button>
                  </>
                ) : ticket.assignedTo?._id === user?._id ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-100/80 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                    Assigned to You
                  </span>
                ) : (
                  <span className="text-slate-700 font-medium">
                    {ticket.assignedTo?.name || "Assigned"}
                  </span>
                )}
              </div>
            ) : (
              /* Customer: Static Read-Only */
              <span>{ticket.assignedTo ? ticket.assignedTo.name : "Unassigned"}</span>
            )}
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
                  className={`rounded-2xl p-5 transition border-0 ${
                    isInternal
                      ? "bg-amber-50/90 shadow-sm"
                      : isAgentOrAdmin
                        ? "bg-white shadow-sm"
                        : "bg-white shadow-sm"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">
                        {msg.senderId?.name || msg.senderEmail}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase text-slate-500">
                        {msg.senderRole}
                      </span>
                      {isInternal && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100/90 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
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

                  <div className="mt-3">
                    <MarkdownRenderer content={msg.body} />
                  </div>

                  {/* Message File Attachments */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mt-3.5 flex flex-wrap gap-2 pt-1">
                      {msg.attachments.map((att: any, attIdx: number) => {
                        const isObj = typeof att === "object" && att !== null;
                        const fileName = isObj ? att.filename : att.split("/").pop();
                        const fileUrl = isObj ? att.url : att;
                        const fileSize =
                          isObj && att.size
                            ? `(${Math.round(att.size / 1024)} KB)`
                            : "";

                        const fullUrl = fileUrl.startsWith("http")
                          ? fileUrl
                          : `${(import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "")}${fileUrl}`;

                        return (
                          <a
                            key={attIdx}
                            href={fullUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100/90 hover:bg-slate-200/80 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs transition-colors border-0"
                          >
                            <FileText className="h-3.5 w-3.5 text-blue-600" />
                            <span className="truncate max-w-xs">{fileName}</span>
                            {fileSize && (
                              <span className="text-[10px] text-slate-400">
                                {fileSize}
                              </span>
                            )}
                            <Download className="h-3 w-3 text-slate-400 ml-0.5" />
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Reply Composer Form */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border-0">
            <form onSubmit={handleSendReply} className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-slate-500">
                  Add Reply
                </span>

                {/* Internal Note Toggle (Staff Only) */}
                {isStaff && (
                  <div className="flex rounded-xl bg-slate-100/90 p-1 text-xs font-medium">
                    <button
                      type="button"
                      disabled={!canReplyPublicly}
                      onClick={() => setMessageType("public")}
                      title={
                        !canReplyPublicly
                          ? `Only ${ticket.assignedTo?.name} or an admin can reply publicly`
                          : ""
                      }
                      className={`inline-flex items-center gap-1 rounded-lg px-3 py-1 transition ${
                        !canReplyPublicly
                          ? "cursor-not-allowed text-slate-400 opacity-50"
                          : messageType === "public"
                            ? "bg-white text-blue-700 shadow-2xs font-semibold"
                            : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {!canReplyPublicly && <Lock className="h-3 w-3" />}
                      Public Reply
                    </button>
                    <button
                      type="button"
                      onClick={() => setMessageType("internal")}
                      className={`inline-flex items-center gap-1 rounded-lg px-3 py-1 transition ${
                        messageType === "internal"
                          ? "bg-amber-500 text-white shadow-2xs font-semibold"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <Lock className="h-3 w-3" />
                      Internal Note
                    </button>
                  </div>
                )}
              </div>

              {/* Collision Alert for Non-Assigned Agents */}
              {!canReplyPublicly && isStaff && (
                <div className="flex items-start gap-2.5 rounded-2xl bg-amber-50/90 p-4 text-xs text-amber-900 shadow-2xs border-0">
                  <Lock className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-950">
                      Assigned to {ticket.assignedTo?.name}
                    </p>
                    <p className="mt-0.5 text-amber-800 leading-relaxed">
                      Public customer replies are restricted to the assigned agent to prevent customer confusion. You can post an <strong>internal note</strong> below to assist your teammate.
                    </p>
                  </div>
                </div>
              )}

              {/* Google Keep style Rich Text WYSIWYG Editor */}
              <RichTextEditor
                value={replyText}
                onChange={setReplyText}
                placeholder={
                  messageType === "internal"
                    ? "Write an internal note (only visible to support agents and admins)..."
                    : "Type your reply to the customer..."
                }
                minHeight="110px"
                disabled={isSubmitting}
                onAttachFile={() => fileInputRef.current?.click()}
                isUploading={isUploading}
              />

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                multiple
                className="hidden"
              />

              {/* Uploaded Attachments Badges */}
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {attachments.map((att, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50/90 px-3 py-1.5 text-xs font-medium text-blue-700 shadow-2xs border-0"
                    >
                      <FileText className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate max-w-xs">{att.filename}</span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(idx)}
                        className="rounded-lg hover:bg-blue-100 p-0.5 text-blue-600 transition"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting || isUploading}
                  className={`inline-flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-50 transition-colors ${
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
        <div className="rounded-2xl bg-white p-6 shadow-sm border-0 h-fit space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Ticket Timeline
          </h2>
          <div className="space-y-4">
            {activities.map((act) => (
              <div
                key={act._id}
                className="relative pl-6 text-xs before:absolute before:left-2 before:top-2 before:h-full before:w-px before:bg-slate-200/80 last:before:hidden"
              >
                <div className="absolute left-0.5 top-1.5 h-3 w-3 rounded-full bg-blue-600 ring-4 ring-blue-50" />
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
