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
  ChevronDown,
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
  const [mobileTab, setMobileTab] = useState<"messages" | "timeline">("messages");
  const [mobileActionsOpen, setMobileActionsOpen] = useState(false);
  const actionsMenuRef = useRef<HTMLDivElement>(null);

  const [replyText, setReplyText] = useState("");
  const [messageType, setMessageType] = useState<"public" | "internal">(
    "public",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        actionsMenuRef.current &&
        !actionsMenuRef.current.contains(e.target as Node)
      ) {
        setMobileActionsOpen(false);
      }
    };
    if (mobileActionsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [mobileActionsOpen]);

  const availableActions = [
    isStaff &&
      ticket?.status !== "resolved" &&
      ticket?.status !== "closed" &&
      ticket?.status !== "in_progress" && {
        id: "in_progress",
        label: "In Progress",
        icon: PlayCircle,
        mobileColor: "text-blue-700 hover:bg-blue-50",
        desktopClass: "bg-blue-50 text-blue-700 hover:bg-blue-100 ring-blue-600/20",
        onClick: () => handleUpdateStatus("in_progress"),
      },
    isStaff &&
      ticket?.status !== "resolved" &&
      ticket?.status !== "closed" &&
      ticket?.status !== "pending" && {
        id: "pending",
        label: "Pending",
        icon: Clock,
        mobileColor: "text-amber-700 hover:bg-amber-50",
        desktopClass: "bg-amber-50 text-amber-700 hover:bg-amber-100 ring-amber-600/20",
        onClick: () => handleUpdateStatus("pending"),
      },
    isStaff &&
      ticket?.status !== "resolved" &&
      ticket?.status !== "closed" && {
        id: "resolve",
        label: "Resolve",
        icon: CheckCircle2,
        mobileColor: "text-emerald-700 hover:bg-emerald-50",
        desktopClass: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 ring-emerald-600/20",
        onClick: () => handleStatusChange("resolve"),
      },
    (ticket?.status === "resolved" || ticket?.status === "closed") && {
      id: "reopen",
      label: "Reopen",
      icon: RotateCcw,
      mobileColor: "text-purple-700 hover:bg-purple-50",
      desktopClass: "bg-purple-50 text-purple-700 hover:bg-purple-100 ring-purple-600/20",
      onClick: () => handleStatusChange("reopen"),
    },
    ticket?.status !== "closed" && {
      id: "close",
      label: "Close",
      icon: XCircle,
      mobileColor: "text-slate-700 hover:bg-slate-100",
      desktopClass: "bg-slate-100 text-slate-700 hover:bg-slate-200 ring-slate-400/20",
      onClick: () => handleStatusChange("close"),
    },
  ].filter(Boolean) as {
    id: string;
    label: string;
    icon: any;
    mobileColor: string;
    desktopClass: string;
    onClick: () => void;
  }[];

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
    <div className="h-full flex flex-col min-h-0 space-y-3 animate-in fade-in duration-200">
      {/* Consolidated Top Ticket Header Card */}
      <div className="shrink-0 rounded-2xl bg-white p-3 sm:p-4 shadow-2xs border border-slate-200/70 space-y-2.5">
        {/* Top Row: Back button, Ticket Number, Status & Action Buttons */}
        <div className="flex items-center justify-between gap-2">
          {/* Badges cluster */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <button
              onClick={() => navigate("/tickets")}
              aria-label="Back to tickets"
              className="inline-flex items-center justify-center h-8 w-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition-colors shrink-0 active:scale-95"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg ring-1 ring-blue-600/20 shrink-0">
              {ticket.ticketNumber}
            </span>
            <div className="shrink-0">
              <StatusBadge status={ticket.status} />
            </div>
            <div className="hidden sm:block shrink-0">
              <PriorityBadge priority={ticket.priority} />
            </div>
            <span className="hidden md:inline-block rounded-full px-2.5 py-0.5 text-xs font-medium text-slate-600 bg-slate-100 shrink-0">
              {ticket.category?.name || "General"}
            </span>
          </div>

          {/* Quick Lifecycle Status Actions */}
          <div className="shrink-0">
            {/* Mobile: Sleek Actions Dropdown Menu */}
            <div className="relative sm:hidden" ref={actionsMenuRef}>
              {availableActions.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={() => setMobileActionsOpen((prev) => !prev)}
                    className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 ring-1 ring-slate-200 active:scale-95 transition-all"
                  >
                    <span>Actions</span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform duration-200 ${
                        mobileActionsOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {mobileActionsOpen && (
                    <div className="absolute right-0 top-full mt-1.5 z-30 w-44 rounded-xl bg-white p-1.5 shadow-lg ring-1 ring-slate-900/10 animate-in fade-in zoom-in-95 duration-150">
                      {availableActions.map((action: any) => {
                        const Icon = action.icon;
                        return (
                          <button
                            key={action.id}
                            onClick={() => {
                              setMobileActionsOpen(false);
                              action.onClick();
                            }}
                            className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold transition-colors ${action.mobileColor}`}
                          >
                            <Icon className="h-4 w-4" />
                            <span>{action.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Desktop: Inline Quick Action Buttons */}
            <div className="hidden sm:flex items-center gap-1.5">
              {availableActions.map((action: any) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    onClick={action.onClick}
                    className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-semibold ring-1 active:scale-95 transition-all ${action.desktopClass}`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{action.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Row 2: Subject Title & Mobile Priority */}
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-snug break-words">
            {ticket.subject}
          </h1>
          <div className="sm:hidden flex items-center gap-1.5 shrink-0 pt-0.5">
            <PriorityBadge priority={ticket.priority} />
          </div>
        </div>

        {/* Row 3: Requester, Category, Assignee & Creation Date */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-slate-500">
          {/* Sub-group 1: Requester & Mobile Category & Mobile Date */}
          <div className="flex items-center justify-between sm:justify-start gap-2 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              {/* Requester with initial avatar */}
              <div className="inline-flex items-center gap-1.5 min-w-0">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                  {(ticket.requesterId?.name || "U").charAt(0).toUpperCase()}
                </span>
                <span className="font-semibold text-slate-800 truncate max-w-[120px] sm:max-w-none">
                  {ticket.requesterId?.name}
                </span>
              </div>

              <span className="text-slate-300">•</span>

              {/* Mobile Category tag */}
              <span className="md:hidden rounded-md px-1.5 py-0.5 text-[11px] font-medium text-slate-600 bg-slate-100 shrink-0">
                {ticket.category?.name || "General"}
              </span>
            </div>

            {/* Mobile Creation Date (aligned to right of row on mobile) */}
            <div className="sm:hidden flex items-center gap-1 text-slate-400 text-[11px] shrink-0">
              <Calendar className="h-3 w-3" />
              <span>
                {new Date(ticket.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>

          {/* Sub-group 2: Assignee & Desktop Creation Date */}
          <div className="flex items-center justify-between sm:justify-end gap-2 min-w-0">
            <div className="inline-flex items-center gap-1.5 min-w-0">
              <span className="font-semibold text-slate-600">Assignee:</span>
              {isAdmin ? (
                <div className="flex items-center gap-1">
                  <select
                    value={ticket.assignedTo?._id || ""}
                    onChange={(e) => handleAssignTicket(e.target.value)}
                    disabled={isAssigning}
                    className="rounded-lg bg-slate-50 py-0.5 px-2 text-xs font-medium text-slate-800 ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 cursor-pointer max-w-[130px] sm:max-w-none truncate"
                  >
                    <option value="" disabled>
                      {ticket.assignedTo ? "Reassign..." : "Select..."}
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
                      className="rounded-lg bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 ring-1 ring-blue-600/20 disabled:opacity-50 transition-colors shrink-0"
                    >
                      Me
                    </button>
                  )}
                </div>
              ) : isAgent ? (
                <div className="flex items-center gap-1">
                  {!ticket.assignedTo ? (
                    <>
                      <span className="text-amber-600 font-medium">Unassigned</span>
                      <button
                        onClick={() => handleAssignTicket(user!._id)}
                        disabled={isAssigning}
                        className="rounded-lg bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 ring-1 ring-emerald-600/20 disabled:opacity-50 transition-colors shrink-0"
                      >
                        {isAssigning ? "..." : "Claim"}
                      </button>
                    </>
                  ) : ticket.assignedTo?._id === user?._id ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 ring-1 ring-blue-600/20">
                      <UserCheck className="h-3 w-3" />
                      You
                    </span>
                  ) : (
                    <span className="text-slate-700 font-medium truncate max-w-[120px]">
                      {ticket.assignedTo?.name || "Assigned"}
                    </span>
                  )}
                </div>
              ) : (
                <span className="font-medium text-slate-800 truncate max-w-[140px]">
                  {ticket.assignedTo ? ticket.assignedTo.name : "Unassigned"}
                </span>
              )}
            </div>

            {/* Desktop Creation Date */}
            <div className="hidden sm:flex items-center gap-1 text-slate-400 text-[11px] shrink-0 sm:ml-2">
              <span className="text-slate-300 mr-1">•</span>
              <Calendar className="h-3 w-3" />
              <span>
                {new Date(ticket.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Tab Control: Switch between WhatsApp Messages & Audit Timeline */}
      <div className="flex lg:hidden rounded-xl bg-slate-200/80 p-1 text-xs font-semibold shrink-0 select-none">
        <button
          type="button"
          onClick={() => setMobileTab("messages")}
          className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
            mobileTab === "messages"
              ? "bg-white text-slate-900 shadow-2xs font-bold"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Messages ({messages.length})
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("timeline")}
          className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
            mobileTab === "timeline"
              ? "bg-white text-slate-900 shadow-2xs font-bold"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Timeline ({activities.length})
        </button>
      </div>

      {/* Main Grid: Thread & Timeline */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 flex-1 min-h-0">
        {/* Left Column: Conversation Stream & Composer */}
        <div
          className={`flex-col lg:col-span-2 min-h-0 space-y-2.5 h-full ${
            mobileTab === "messages" ? "flex" : "hidden lg:flex"
          }`}
        >
          {/* Messages Stream Container (WhatsApp Chat Layout) */}
          <div className="flex-1 overflow-y-auto rounded-2xl bg-slate-50/60 border border-slate-200/70 p-4 sm:p-5 space-y-3 shadow-2xs custom-scrollbar min-h-[320px] lg:min-h-0">
            {messages.map((msg) => {
              const isInternal = msg.type === "internal";
              const isEmail = msg.source === "email";
              const isAgentOrAdmin =
                msg.senderRole === "agent" || msg.senderRole === "admin";
              const isAuthorMe = Boolean(
                (msg.senderId?._id && String(msg.senderId._id) === String(user?._id)) ||
                (msg.senderEmail && user?.email && msg.senderEmail.toLowerCase() === user.email.toLowerCase())
              );
              const isMyRoleStaff = user?.role === "agent" || user?.role === "admin";
              // Support view: Staff/Admin on Right, Customer on Left. Customer view: Me on Right, Staff on Left.
              const isRightAligned = isMyRoleStaff
                ? (isAgentOrAdmin || isAuthorMe)
                : isAuthorMe;

              // 1. Internal Note: Centered System Banner
              if (isInternal) {
                return (
                  <motion.div
                    key={msg._id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex justify-center my-3"
                  >
                    <div className="max-w-xl rounded-xl bg-amber-50/90 border border-amber-200/80 px-4 py-2 text-xs text-amber-900 shadow-2xs space-y-1">
                      <div className="flex items-center justify-between gap-3 font-semibold text-amber-950">
                        <span className="inline-flex items-center gap-1.5">
                          <Lock className="h-3 w-3 text-amber-600" />
                          <span>Internal Note</span>
                          <span className="text-amber-700 font-normal">
                            ({msg.senderId?.name || "Staff"})
                          </span>
                        </span>
                        <span className="text-[10px] text-amber-600/80 font-normal">
                          {formatRelativeTime(msg.createdAt)}
                        </span>
                      </div>
                      <div className="text-amber-900 leading-relaxed text-xs">
                        <MarkdownRenderer content={msg.body} />
                      </div>
                    </div>
                  </motion.div>
                );
              }

              // 2. WhatsApp-Style Chat Bubble: Right vs Left
              return (
                <motion.div
                  key={msg._id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                  className={`flex w-full ${
                    isRightAligned ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`relative max-w-[85%] sm:max-w-[75%] px-4 py-2.5 shadow-2xs transition-all ${
                      isRightAligned
                        ? "bg-[#D9FDD3] border border-[#C5EDBF] rounded-2xl rounded-tr-xs text-slate-900"
                        : "bg-white border border-slate-200/80 rounded-2xl rounded-tl-xs text-slate-900"
                    }`}
                  >
                    {/* Header: Sender Name & Role Pill */}
                    {isRightAligned ? (
                      !isAuthorMe && (
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-xs font-bold leading-tight text-emerald-800">
                            {msg.senderId?.name || msg.senderEmail}
                          </span>
                          <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/70 px-1.5 py-0.2 rounded">
                            Staff
                          </span>
                        </div>
                      )
                    ) : (
                      <div className="flex items-center gap-1.5 mb-1">
                        <span
                          className={`text-xs font-bold leading-tight ${
                            isAgentOrAdmin ? "text-blue-600" : "text-emerald-700"
                          }`}
                        >
                          {msg.senderId?.name || msg.senderEmail}
                        </span>
                        {isAgentOrAdmin && (
                          <span className="text-[9px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100/70 px-1.5 py-0.2 rounded">
                            Staff
                          </span>
                        )}
                      </div>
                    )}

                    {/* Message Body Content */}
                    <div className="text-sm text-slate-800 leading-relaxed break-words">
                      <MarkdownRenderer content={msg.body} />
                    </div>

                    {/* Message File Attachments */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5 pt-1">
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
                              className="inline-flex items-center gap-1.5 rounded-lg bg-black/5 hover:bg-black/10 px-2.5 py-1 text-xs font-medium text-slate-700 transition"
                            >
                              <FileText className="h-3 w-3 text-slate-500" />
                              <span className="truncate max-w-[140px]">
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

                    {/* Bottom Timestamp & Delivery Status */}
                    <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-slate-500 select-none">
                      {isEmail && (
                        <span title="Sent via Email">
                          <Mail className="h-2.5 w-2.5 text-slate-400 mr-0.5" />
                        </span>
                      )}
                      <span title={new Date(msg.createdAt).toLocaleString()}>
                        {formatRelativeTime(msg.createdAt)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Reply Composer - Compact Single Card */}
          <div className="shrink-0">
            {/* Collision Alert for Non-Assigned Agents (if restricted) */}
            {!canReplyPublicly && isStaff && (
              <div className="mb-2 flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-1.5 text-xs text-amber-900 ring-1 ring-amber-600/20">
                <Lock className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                <span className="truncate">
                  Assigned to {ticket.assignedTo?.name}. Use <strong>Internal Note</strong> to assist.
                </span>
              </div>
            )}

            <form onSubmit={handleSendReply}>
              <RichTextEditor
                value={replyText}
                onChange={setReplyText}
                placeholder={
                  messageType === "internal"
                    ? "Write an internal note for staff..."
                    : "Type your reply to the customer..."
                }
                minHeight="40px"
                maxHeight="110px"
                disabled={isSubmitting}
                onAttachFile={() => fileInputRef.current?.click()}
                isUploading={isUploading}
                onKeyDown={handleKeyDown}
                containerClassName={
                  messageType === "internal"
                    ? "bg-amber-50/40 border-amber-300/80"
                    : "bg-white"
                }
                topSlot={
                  isStaff ? (
                    <div className="flex items-center justify-between px-3 pt-2 pb-1.5 border-b border-slate-100/80">
                      <div className="inline-flex items-center gap-1 rounded-lg bg-slate-100 p-0.5 text-xs font-semibold">
                        <button
                          type="button"
                          disabled={!canReplyPublicly}
                          onClick={() => setMessageType("public")}
                          className={`inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 transition-all text-[11px] ${
                            !canReplyPublicly
                              ? "cursor-not-allowed text-slate-400 opacity-50"
                              : messageType === "public"
                                ? "bg-white text-slate-900 shadow-xs font-bold"
                                : "text-slate-500 hover:text-slate-900"
                          }`}
                        >
                          Public Reply
                        </button>
                        <button
                          type="button"
                          onClick={() => setMessageType("internal")}
                          className={`inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 transition-all text-[11px] ${
                            messageType === "internal"
                              ? "bg-amber-600 text-white shadow-xs font-bold"
                              : "text-slate-500 hover:text-amber-800"
                          }`}
                        >
                          <Lock className="h-2.5 w-2.5" />
                          <span>Internal Note</span>
                        </button>
                      </div>

                      <span className="text-[10px] text-slate-400 font-medium">
                        {messageType === "internal"
                          ? "Visible to staff only"
                          : "Visible to customer"}
                      </span>
                    </div>
                  ) : null
                }
                attachmentsSlot={
                  attachments.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 px-3 pt-2">
                      {attachments.map((att, idx) => (
                        <div
                          key={idx}
                          className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 ring-1 ring-blue-600/20"
                        >
                          <FileText className="h-3 w-3 shrink-0" />
                          <span className="truncate max-w-[120px]">
                            {att.filename}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeAttachment(idx)}
                            aria-label="Remove attachment"
                            className="rounded hover:bg-blue-100 p-0.5 text-blue-600"
                          >
                            <Trash2 className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null
                }
                bottomRightSlot={
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 hidden sm:inline select-none">
                      {isMac ? "⌘↵" : "Ctrl+↵"}
                    </span>
                    <button
                      type="submit"
                      disabled={
                        isSubmitting ||
                        isUploading ||
                        (!replyText.trim() && attachments.length === 0)
                      }
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-white shadow-xs disabled:opacity-40 active:scale-95 transition-all ${
                        messageType === "internal"
                          ? "bg-amber-600 hover:bg-amber-700"
                          : "bg-blue-600 hover:bg-blue-700"
                      }`}
                    >
                      <Send className="h-3 w-3" />
                      <span>
                        {isSubmitting
                          ? "Sending..."
                          : messageType === "internal"
                            ? "Add Note"
                            : "Reply"}
                      </span>
                    </button>
                  </div>
                }
              />

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                multiple
                className="hidden"
              />
            </form>
          </div>
        </div>

        {/* Right Column: Ticket Timeline - Independently Scrollable */}
        <div
          className={`flex-col lg:col-span-1 min-h-0 rounded-2xl bg-white p-3.5 sm:p-4 shadow-2xs h-full ${
            mobileTab === "timeline" ? "flex" : "hidden lg:flex"
          }`}
        >
          <div className="shrink-0 flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Audit Timeline
            </h2>
            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {activities.length} events
            </span>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 space-y-3.5 custom-scrollbar min-h-0">
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
                    <p className="mt-0.5 text-slate-600 line-clamp-2">
                      {act.newValue.replace(/<[^>]*>?/gm, "").trim()}
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
