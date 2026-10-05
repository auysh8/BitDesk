// client/src/pages/categories/CategoryManager.tsx
import React, { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";
import { useToast } from "../../context/ToastContext";
import { Skeleton } from "../../components/common/Skeleton";
import {
  PlusCircle,
  Tags,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";

interface CategoryItem {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export const CategoryManager: React.FC = () => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // New category form
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      const res = await axiosClient.get("/categories");
      setCategories(res.data.data || []);
    } catch (e) {
      console.error("Failed to load categories", e);
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    setError(null);

    try {
      await axiosClient.post("/categories", {
        name: name.trim(),
        description: description.trim(),
      });
      toast.success(`Category "${name.trim()}" created`);
      setName("");
      setDescription("");
      await fetchCategories();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to create category";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean, catName: string) => {
    try {
      await axiosClient.patch(`/categories/${id}`, {
        isActive: !currentStatus,
      });
      toast.success(`"${catName}" is now ${!currentStatus ? "active" : "inactive"}`);
      await fetchCategories();
    } catch (e) {
      toast.error("Failed to update category status");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
          <Tags className="h-6 w-6 text-blue-600" />
          <span>Ticket Categories</span>
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Organize ticket categorization schemes, routing targets, and SLAs.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Category List (2 Cols) */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-2xs lg:col-span-2">
          <div className="bg-slate-50/80 p-4 px-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Active Category Directory
            </h2>
            <span className="text-xs font-semibold text-slate-400">
              {categories.length} Total
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {loading ? (
              <div className="p-6 space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                    <Skeleton className="h-7 w-20 rounded-xl" />
                  </div>
                ))}
              </div>
            ) : categories.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-sm text-slate-500">No categories found.</p>
                <p className="text-xs text-slate-400 mt-1">
                  Use the form on the right to create your first category.
                </p>
              </div>
            ) : (
              categories.map((c) => (
                <div
                  key={c._id}
                  className="flex items-center justify-between p-4 px-6 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600 mt-0.5">
                      <Tags className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        {c.name}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {c.description || "No description provided."}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        c.isActive
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
                          : "bg-slate-100 text-slate-500 ring-1 ring-slate-400/20"
                      }`}
                    >
                      {c.isActive ? (
                        <>
                          <CheckCircle2 className="h-3 w-3" /> Active
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3" /> Inactive
                        </>
                      )}
                    </span>

                    <button
                      onClick={() => handleToggleActive(c._id, c.isActive, c.name)}
                      className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                        c.isActive
                          ? "bg-rose-50 text-rose-700 hover:bg-rose-100"
                          : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      }`}
                    >
                      {c.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Create Category Form (1 Col) */}
        <div className="rounded-2xl bg-white p-6 shadow-2xs h-fit space-y-4">
          <h2 className="text-sm font-bold text-slate-900">
            Add New Category
          </h2>

          {error && (
            <div className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700 ring-1 ring-rose-500/20">
              {error}
            </div>
          )}

          <form onSubmit={handleCreateCategory} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Category Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Billing & Payments"
                className="mt-1.5 w-full rounded-xl bg-slate-100/80 px-3.5 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of tickets in this category..."
                className="mt-1.5 w-full rounded-xl bg-slate-100/80 p-3 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm shadow-blue-600/25 hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50 transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Creating Category...</span>
                </>
              ) : (
                <>
                  <PlusCircle className="h-4 w-4" />
                  <span>Create Category</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CategoryManager;
