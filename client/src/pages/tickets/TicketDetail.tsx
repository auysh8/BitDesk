import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import axiosClient from "../../api/axiosClient";
import { StatusBadge } from "../../components/common/StatusBadge";
import { PriorityBadge } from "../../components/common/PriorityBadge";
import {
  Skeleton,
  SkeletonMessageBubble,
} from "../../components/common/Skeleton";
import {
  ArrowLeft,
  Send,
  Lock,
  Mail,
  Globe,
  CheckCircle2,
  RotateCcw,
  XCircle,
  Clock,
  PlayCircle,
  FileText,
  Trash2,
  Download,
  UserCheck,
  Calendar,
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
  const { toast } = useToast();

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isMac =
    typeof window !== "undefined" &&
    navigator.platform.toUpperCase().indexOf("MAC") >= 0;

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
    } catch (err: any) {
      console.error("Failed to load ticket details", err);
      toast.error(
        err.response?.data?.message || "Failed to load ticket details",
      );
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
      toast.success("Ticket reassigned successfully");
      await fetchTicketData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to assign ticket");
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
      toast.success("Attachment uploaded");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to upload file");
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = "";
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSendReply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
      toast.success(
        actualType === "internal"
          ? "Internal note added"
          : "Reply sent to customer",
      );
      await fetchTicketData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to send message");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (action: "resolve" | "reopen" | "close") => {
    try {
      await axiosClient.post(`/tickets/${ticketId}/${action}`);
      toast.success(`Ticket ${action}d successfully`);
      await fetchTicketData();
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || `Failed to ${action} ticket`,
      );
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      await axiosClient.patch(`/tickets/${ticketId}`, { status: newStatus });
      toast.success(`Status updated to ${newStatus.replace("_", " ")}`);
      await fetchTicketData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || `Failed to update status`);
    }
  };

  // Keyboard shortcut listener: Cmd/Ctrl + Enter to send reply
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSendReply();
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diffSecs = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSecs < 60) return "Just now";
    if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
    if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)}h ago`;
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  };

  // Shimmer Skeleton View for zero layout shifts
  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-48 rounded-xl" />
        </div>

        {/* Header Skeleton */}
        <div className="rounded-2xl bg-white p-6 shadow-2xs space-y-4">
          <div className="flex gap-2">
            <Skeleton className="h-6 w-28 rounded-xl" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>

        {/* Grid Skeleton */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <SkeletonMessageBubble />
            <SkeletonMessageBubble isOwn />
            <SkeletonMessageBubble />
            <div className="rounded-2xl bg-white p-6 shadow-2xs space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-2xs space-y-4 h-80">
            <Skeleton className="h-4 w-32" />
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="rounded-2xl bg-white p-12 text-center shadow-2xs">
        <p className="text-sm font-semibold text-rose-600">Ticket not found</p>
        <button
          onClick={() => navigate("/tickets")}
          className="mt-3 inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3.5 py-2 text-xs font-semibold text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Return to Tickets
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Back button & Lifecycle Actions Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          onClick={() => navigate("/tickets")}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors self-start sm:self-auto"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Tickets</span>
        </button>

        {/* Quick Lifecycle Status Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {isStaff &&
            ticket.status !== "resolved" &&
            ticket.status !== "closed" && (
              <>
                {ticket.status !== "in_progress" && (
                  <button
                    onClick={() => handleUpdateStatus("in_progress")}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 ring-1 ring-blue-600/20 active:scale-95 transition-all"
                  >
                    <PlayCircle className="h-3.5 w-3.5" />
                    <span>In Progress</span>
                  </button>
                )}
                {ticket.status !== "pending" && (
                  <button
                    onClick={() => handleUpdateStatus("pending")}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 ring-1 ring-amber-600/20 active:scale-95 transition-all"
                  >
                    <Clock className="h-3.5 w-3.5" />
                    <span>Pending</span>
                  </button>
                )}
              </>
            )}

          {ticket.status !== "resolved" &&
            ticket.status !== "closed" &&
            isStaff && (
              <button
                onClick={() => handleStatusChange("resolve")}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 ring-1 ring-emerald-600/20 active:scale-95 transition-all"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Resolve</span>
              </button>
            )}

          {(ticket.status === "resolved" || ticket.status === "closed") && (
            <button
              onClick={() => handleStatusChange("reopen")}
              className="inline-flex items-center gap-1.5 rounded-xl bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-100 ring-1 ring-purple-600/20 active:scale-95 transition-all"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reopen</span>
            </button>
          )}

          {ticket.status !== "closed" && (
            <button
              onClick={() => handleStatusChange("close")}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 ring-1 ring-slate-400/20 active:scale-95 transition-all"
            >
              <XCircle className="h-3.5 w-3.5" />
              <span>Close</span>
            </button>
          )}
        </div>
      </div>

      {/* Ticket Metadata Header Card */}
      <div className="rounded-2xl bg-white p-6 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-xl ring-1 ring-blue-600/20">
            {ticket.ticketNumber}
          </span>
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
          <span className="rounded-full px-2.5 py-0.5 text-xs font-medium text-slate-600 bg-slate-100">
            {ticket.category?.name || "General"}
          </span>
        </div>

        <h1 className="mt-3 text-xl font-bold tracking-tight text-slate-900">
          {ticket.subject}
        </h1>

        {/* Requester & Assignee Strip */}
        <div className="mt-5 flex flex-wrap items-center gap-6 bg-slate-50/70 -mx-6 -mb-6 p-4 rounded-b-2xl text-xs text-slate-500">
          <div>
            <span className="font-semibold text-slate-700">Requester: </span>
            <span className="font-medium text-slate-900">
              {ticket.requesterId?.name}
            </span>{" "}
            ({ticket.requesterEmail})
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-700">Assigned To: </span>
            {isAdmin ? (
              <div className="flex items-center gap-2">
                <select
                  value={ticket.assignedTo?._id || ""}
                  onChange={(e) => handleAssignTicket(e.target.value)}
                  disabled={isAssigning}
                  className="rounded-xl bg-white py-1 px-3 text-xs font-medium text-slate-800 shadow-2xs ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 cursor-pointer"
                >
                  <option value="" disabled>
                    {ticket.assignedTo
                      ? "Reassign to..."
                      : "Select Assignee..."}
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
                    className="rounded-xl bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 ring-1 ring-blue-600/20 disabled:opacity-50 transition-colors"
                  >
                    Assign to Me
                  </button>
                )}
              </div>
            ) : isAgent ? (
              <div className="flex items-center gap-2">
                {!ticket.assignedTo ? (
                  <>
                    <span className="text-amber-600 font-medium">
                      Unassigned
                    </span>
                    <button
                      onClick={() => handleAssignTicket(user!._id)}
                      disabled={isAssigning}
                      className="rounded-xl bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 ring-1 ring-emerald-600/20 disabled:opacity-50 transition-colors"
                    >
                      {isAssigning ? "Claiming..." : "Claim Ticket"}
                    </button>
                  </>
                ) : ticket.assignedTo?._id === user?._id ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-600/20">
                    <UserCheck className="h-3 w-3" />
                    Assigned to You
                  </span>
                ) : (
                  <span className="text-slate-700 font-medium">
                    {ticket.assignedTo?.name || "Assigned"}
                  </span>
                )}
              </div>
            ) : (
              <span className="font-medium text-slate-800">
                {ticket.assignedTo ? ticket.assignedTo.name : "Unassigned"}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 ml-auto text-slate-400">
            <Calendar className="h-3.5 w-3.5" />
            <span>{new Date(ticket.createdAt).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Thread & Timeline */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Conversation Stream & Composer */}
        <div className="space-y-6 lg:col-span-2">
          {/* Messages Stream */}
          <div className="space-y-4">
            {messages.map((msg) => {
              const isInternal = msg.type === "internal";
              const isEmail = msg.source === "email";
              const isAgentOrAdmin =
                msg.senderRole === "agent" || msg.senderRole === "admin";

              return (
                <motion.div
                  key={msg._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] as any }}
                  className={`rounded-2xl p-5 transition-all shadow-2xs ${
                    isInternal
                      ? "bg-amber-50/80 ring-1 ring-amber-500/25"
                      : isAgentOrAdmin
                        ? "bg-white"
                        : "bg-slate-50/80"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      {/* Avatar initial */}
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-xl text-xs font-bold text-white shadow-2xs ${
                          isInternal
                            ? "bg-amber-600"
                            : isAgentOrAdmin
                              ? "bg-blue-600"
                              : "bg-emerald-600"
                        }`}
                      >
                        {(msg.senderId?.name || msg.senderEmail || "U")
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div>
                        <span className="font-semibold text-slate-900 block leading-tight">
                          {msg.senderId?.name || msg.senderEmail}
                        </span>
                        <span className="text-[10px] text-slate-400 capitalize">
                          {msg.senderRole}
                        </span>
                      </div>

                      {isInternal && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
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
                        <span className="text-[11px]">
                          {isEmail ? "Email" : "Web"}
                        </span>
                      </span>
                      <span>•</span>
                      <span
                        className="text-[11px]"
                        title={new Date(msg.createdAt).toLocaleString()}
                      >
                        {formatRelativeTime(msg.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="mt-3.5">
                    <MarkdownRenderer content={msg.body} />
                  </div>

                  {/* Message File Attachments */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mt-3.5 flex flex-wrap gap-2 pt-1">
                      {msg.attachments.map((att: any, attIdx: number) => {
                        const isObj = typeof att === "object" && att !== null;
                        const fileName = isObj
                          ? att.filename
                          : att.split("/").pop();
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
                            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200 transition-colors shadow-2xs"
                          >
                            <FileText className="h-3.5 w-3.5 text-blue-600" />
                            <span className="truncate max-w-xs">
                              {fileName}
                            </span>
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
                </motion.div>
              );
            })}
          </div>

          {/* Reply Composer Card */}
          <div
            onKeyDown={handleKeyDown}
            className="rounded-2xl bg-white p-6 shadow-2xs space-y-4"
          >
            <form onSubmit={handleSendReply} className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Compose Response
                </span>

                {/* Internal Note vs Public Reply Toggle with Sliding Indicator */}
                {isStaff && (
                  <div className="relative flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
                    <button
                      type="button"
                      disabled={!canReplyPublicly}
                      onClick={() => setMessageType("public")}
                      className={`relative inline-flex items-center gap-1 rounded-lg px-3 py-1 transition-colors ${
                        !canReplyPublicly
                          ? "cursor-not-allowed text-slate-400 opacity-50"
                          : messageType === "public"
                            ? "text-blue-700 font-bold"
                            : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {messageType === "public" && (
                        <motion.div
                          layoutId="replyTabIndicator"
                          className="absolute inset-0 rounded-lg bg-white shadow-2xs"
                          transition={{ type: "spring", stiffness: 450, damping: 35 }}
                        />
                      )}
                      {!canReplyPublicly && <Lock className="h-3 w-3 relative z-10" />}
                      <span className="relative z-10">Public Reply</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMessageType("internal")}
                      className={`relative inline-flex items-center gap-1 rounded-lg px-3 py-1 transition-colors ${
                        messageType === "internal"
                          ? "text-amber-800 font-bold"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {messageType === "internal" && (
                        <motion.div
                          layoutId="replyTabIndicator"
                          className="absolute inset-0 rounded-lg bg-amber-100 shadow-2xs"
                          transition={{ type: "spring", stiffness: 450, damping: 35 }}
                        />
                      )}
                      <Lock className="h-3 w-3 relative z-10" />
                      <span className="relative z-10">Internal Note</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Collision Alert for Non-Assigned Agents */}
              {!canReplyPublicly && isStaff && (
                <div className="flex items-start gap-2.5 rounded-2xl bg-amber-50 p-4 text-xs text-amber-900 ring-1 ring-amber-600/20">
                  <Lock className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-950">
                      Assigned to {ticket.assignedTo?.name}
                    </p>
                    <p className="mt-0.5 text-amber-800 leading-relaxed">
                      Public customer replies are restricted to the assigned
                      agent to prevent customer confusion. You can post an{" "}
                      <strong>internal note</strong> below to assist your
                      teammate.
                    </p>
                  </div>
                </div>
              )}

              {/* Rich Text WYSIWYG Editor */}
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
                      className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 shadow-2xs ring-1 ring-blue-600/20"
                    >
                      <FileText className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate max-w-xs">{att.filename}</span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(idx)}
                        aria-label="Remove attachment"
                        className="rounded-lg hover:bg-blue-100 p-0.5 text-blue-600 transition"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Bottom Action Row with Keyboard Shortcut Hint */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-400 hidden sm:inline">
                  Press{" "}
                  <kbd className="rounded-lg bg-slate-100 px-1.5 py-0.5 font-semibold text-slate-600 shadow-2xs">
                    {isMac ? "⌘ + Enter" : "Ctrl + Enter"}
                  </kbd>{" "}
                  to send
                </span>

                <button
                  type="submit"
                  disabled={isSubmitting || isUploading}
                  className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold text-white shadow-sm disabled:opacity-50 active:scale-[0.98] transition-all ${
                    messageType === "internal"
                      ? "bg-amber-600 hover:bg-amber-700 shadow-amber-600/20"
                      : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/20"
                  }`}
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>
                    {isSubmitting
                      ? "Sending..."
                      : messageType === "internal"
                        ? "Add Note"
                        : "Send Reply"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Ticket Timeline */}
        <div className="rounded-2xl bg-white p-6 shadow-2xs h-fit space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Audit Timeline
          </h2>
          <div className="space-y-4">
            {activities.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                No activity logged yet.
              </p>
            ) : (
              activities.map((act) => (
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
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetail;
