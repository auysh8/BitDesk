// client/src/pages/categories/CategoryManager.tsx
import React, { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";
import { PlusCircle, Tags, CheckCircle2, XCircle } from "lucide-react";

export const CategoryManager: React.FC = () => {
  const [categories, setCategories] = useState<any[]>([]);
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
      console.error("Failed to load categories");
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
        name,
        description,
      });
      setName("");
      setDescription("");
      await fetchCategories();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await axiosClient.patch(`/categories/${id}`, {
        isActive: !currentStatus,
      });
      await fetchCategories();
    } catch (e) {
      alert("Failed to update category status");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Ticket Categories
        </h1>
        <p className="text-sm text-slate-500">
          Manage support request categories available to customers and agents.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Category List (2 Cols) */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs lg:col-span-2">
          <div className="border-b border-slate-100 p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-600">
              Existing Categories
            </h2>
          </div>

          <div className="divide-y divide-slate-100">
            {loading ? (
              <p className="p-6 text-sm text-slate-400">
                Loading categories...
              </p>
            ) : categories.length === 0 ? (
              <p className="p-6 text-sm text-slate-400">No categories found.</p>
            ) : (
              categories.map((c) => (
                <div
                  key={c._id}
                  className="flex items-center justify-between p-4 hover:bg-slate-50 transition"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-blue-50 p-2 text-blue-600 mt-0.5">
                      <Tags className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {c.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {c.description || "No description provided."}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        c.isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
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
                      onClick={() => handleToggleActive(c._id, c.isActive)}
                      className="text-xs font-medium text-slate-500 hover:text-slate-800 underline"
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
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs h-fit">
          <h2 className="text-base font-semibold text-slate-900">
            Add New Category
          </h2>

          {error && (
            <div className="mt-3 rounded-lg bg-red-50 p-2.5 text-xs text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleCreateCategory} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Category Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Billing, Technical Support"
                className="mt-1 w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of issues under this category..."
                className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-blue-600 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
            >
              <PlusCircle className="h-4 w-4" />
              {isSubmitting ? "Creating..." : "Create Category"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CategoryManager;
