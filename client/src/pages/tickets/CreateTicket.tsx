// client/src/pages/tickets/CreateTicket.tsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import { useToast } from "../../context/ToastContext";
import {
  ArrowLeft,
  AlertCircle,
  FileText,
  Trash2,
  ArrowDown,
  Minus,
  ArrowUp,
  Flame,
  UploadCloud,
  Loader2,
  PlusCircle,
} from "lucide-react";

export const CreateTicket: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<any[]>([]);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [description, setDescription] = useState("");
  const [attachments, setAttachments] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCats = async () => {
      try {
        const res = await axiosClient.get("/categories");
        const list = res.data.data || [];
        setCategories(list);
        if (list.length > 0) setCategory(list[0]._id);
      } catch (e) {
        console.error("Failed to load categories");
      }
    };
    loadCats();
  }, []);

  const uploadFileList = async (files: FileList | null) => {
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
      toast.success(
        `Attached ${uploadedFiles.length} file${uploadedFiles.length > 1 ? "s" : ""}`,
      );
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to upload file");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    uploadFileList(e.target.files);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    uploadFileList(e.dataTransfer.files);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await axiosClient.post("/tickets", {
        subject,
        category,
        priority,
        description,
        attachments,
      });

      const newTicket = res.data.data;
      toast.success(`Ticket ${newTicket.ticketNumber || ""} created!`);
      navigate(`/tickets/${newTicket._id}`);
    } catch (err: any) {
      const apiErrors = err.response?.data?.errors;
      const msg =
        Array.isArray(apiErrors) && apiErrors.length > 0
          ? apiErrors.join(". ")
          : err.response?.data?.message || "Failed to create ticket.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const priorityOptions = [
    {
      id: "low",
      label: "Low",
      icon: ArrowDown,
      activeColor: "bg-slate-100 text-slate-800 ring-2 ring-slate-400 font-bold",
      inactiveColor: "bg-slate-50 text-slate-600 hover:bg-slate-100",
    },
    {
      id: "medium",
      label: "Medium",
      icon: Minus,
      activeColor: "bg-blue-50 text-blue-700 ring-2 ring-blue-500 font-bold",
      inactiveColor: "bg-slate-50 text-slate-600 hover:bg-slate-100",
    },
    {
      id: "high",
      label: "High",
      icon: ArrowUp,
      activeColor: "bg-orange-50 text-orange-700 ring-2 ring-orange-500 font-bold",
      inactiveColor: "bg-slate-50 text-slate-600 hover:bg-slate-100",
    },
    {
      id: "urgent",
      label: "Urgent",
      icon: Flame,
      activeColor: "bg-rose-50 text-rose-700 ring-2 ring-rose-500 font-bold",
      inactiveColor: "bg-slate-50 text-slate-600 hover:bg-slate-100",
    },
  ] as const;

  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-in fade-in duration-200">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Tickets</span>
      </button>

      <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-2xs space-y-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-blue-600" />
            <span>Create Support Request</span>
          </h1>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed">
            Provide details below so our support team can triage and resolve
            your inquiry promptly.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2.5 rounded-2xl bg-rose-50 p-4 text-xs font-medium text-rose-700 ring-1 ring-rose-500/20">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Subject Field */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Subject <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Cannot access invoice billing or payment gateway"
              className="mt-1.5 w-full rounded-xl bg-slate-100/80 px-4 py-2.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>

          {/* Category Dropdown */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              className="mt-1.5 w-full rounded-xl bg-slate-100/80 px-3.5 py-2.5 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
            >
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Interactive Priority Selector Cards */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Urgency / Priority
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {priorityOptions.map((opt) => {
                const IconComponent = opt.icon;
                const isSelected = priority === opt.id;

                return (
                  <button
                    key={opt.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setPriority(opt.id)}
                    className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs transition-all active:scale-95 cursor-pointer ${
                      isSelected ? opt.activeColor : opt.inactiveColor
                    }`}
                  >
                    <IconComponent className="h-3.5 w-3.5" />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description Textarea */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue, step-by-step reproduction, and expected behavior..."
              className="mt-1.5 w-full rounded-xl bg-slate-100/80 p-4 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all leading-relaxed"
            />
          </div>

          {/* Drag & Drop File Attachments Zone */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Attachments (Optional)
            </label>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              multiple
              className="hidden"
            />

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center rounded-2xl p-6 text-center cursor-pointer shadow-2xs transition-all ${
                isDragging
                  ? "bg-blue-50/80 ring-2 ring-blue-500/30"
                  : "bg-slate-100/70 hover:bg-slate-100"
              }`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-2xs text-blue-600 mb-2">
                {isUploading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                ) : (
                  <UploadCloud className="h-5 w-5" />
                )}
              </div>
              <p className="text-xs font-semibold text-slate-700">
                {isUploading
                  ? "Uploading files..."
                  : "Drop files here or click to browse"}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Supports images, PDF documents, and logs (up to 10MB each)
              </p>
            </div>

            {/* Uploaded File Badges */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {attachments.map((att, idx) => (
                  <div
                    key={idx}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 ring-1 ring-blue-600/20 shadow-2xs"
                  >
                    <FileText className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                    <span className="truncate max-w-xs">{att.filename}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeAttachment(idx);
                      }}
                      aria-label="Remove attachment"
                      className="rounded-lg hover:bg-blue-100 p-0.5 text-blue-600 transition"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions Row */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || isUploading}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-semibold text-white shadow-sm shadow-blue-600/25 hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50 transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Submitting Ticket...</span>
                </>
              ) : (
                <span>Submit Ticket</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTicket;
