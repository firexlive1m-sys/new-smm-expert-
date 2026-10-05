import React, { useState, useEffect } from 'react';
import { Category } from '../../types';
import { dbService } from '../../lib/db';
import { PlatformIcon } from '../PlatformIcon';
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Save,
  X,
  AlertTriangle,
  Loader2,
  CheckCircle,
} from 'lucide-react';

export const AdminCategories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteModalCategory, setDeleteModalCategory] = useState<Category | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState(1);
  const [active, setActive] = useState(true);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadCategories = async () => {
    try {
      const list = await dbService.getCategories(false);
      setCategories(list);
    } catch (err) {
      console.error('Error loading categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
    const unsub = dbService.subscribe(() => {
      loadCategories();
    });
    return unsub;
  }, []);

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setImageUrl('');
    setDescription('Followers • Likes • Views');
    setSortOrder(categories.length + 1);
    setActive(true);
    setModalOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setImageUrl(cat.imageUrl || '');
    setDescription(cat.description || '');
    setSortOrder(cat.sortOrder);
    setActive(cat.active);
    setModalOpen(true);
  };

  const handleToggleActive = async (cat: Category) => {
    try {
      const updated = { ...cat, active: !cat.active };
      await dbService.saveCategory(updated);
      await loadCategories();
      showToast(`${cat.name} is now ${updated.active ? 'Visible' : 'Hidden'}`);
    } catch (err) {
      console.error('Toggle active error:', err);
    }
  };

  const confirmDelete = async () => {
    if (!deleteModalCategory) return;
    setIsDeleting(true);
    try {
      await dbService.deleteCategory(deleteModalCategory.id);
      await loadCategories();
      showToast(`Category "${deleteModalCategory.name}" deleted successfully`);
      setDeleteModalCategory(null);
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete category. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      const catId = editingCategory
        ? editingCategory.id
        : `cat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

      const generatedSlug =
        slug.trim().toLowerCase().replace(/[^a-z0-9]/g, '-') ||
        name.trim().toLowerCase().replace(/[^a-z0-9]/g, '-');

      const catToSave: Category = {
        id: catId,
        name: name.trim(),
        slug: generatedSlug,
        imageUrl: imageUrl.trim() || undefined,
        description: description.trim(),
        sortOrder: Number(sortOrder) || 1,
        active,
      };

      await dbService.saveCategory(catToSave);
      await loadCategories();
      showToast(
        editingCategory
          ? `Category "${catToSave.name}" updated successfully`
          : `New category "${catToSave.name}" added successfully`
      );
      setModalOpen(false);
    } catch (err) {
      console.error('Save error:', err);
      alert('Failed to save category. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-fade-in">
          <CheckCircle className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-black text-white">Categories Management</h1>
          <p className="text-xs text-slate-400">
            Add platforms, upload/link logos, change sort order, and toggle visibility.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 rounded-xl bg-[#F72585] hover:bg-[#E01E75] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-pink-600/30 cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
        </button>
      </div>

      {/* Categories Grid / Cards */}
      {loading ? (
        <div className="flex items-center justify-center p-12 text-slate-400 text-xs gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-[#F72585]" />
          <span>Loading categories...</span>
        </div>
      ) : categories.length === 0 ? (
        <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-3xl">
          <p className="text-slate-400 text-xs font-bold">No categories found.</p>
          <button
            onClick={handleOpenAdd}
            className="mt-3 px-4 py-2 rounded-xl bg-[#F72585] text-white text-xs font-bold cursor-pointer"
          >
            Create Your First Category
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className={`p-4 rounded-2xl border transition-all ${
                cat.active
                  ? 'bg-slate-800/80 border-slate-700/80 shadow-md'
                  : 'bg-slate-850/50 border-slate-800 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 p-2 flex items-center justify-center shrink-0">
                    <PlatformIcon
                      nameOrSlug={cat.name}
                      imageUrl={cat.imageUrl}
                      className="w-8 h-8"
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-black text-white flex items-center gap-2 truncate">
                      <span className="truncate">{cat.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        #{cat.sortOrder}
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400 truncate max-w-[150px]">
                      {cat.description || 'No description'}
                    </p>
                    <span className="text-[10px] text-slate-500 font-mono block">
                      slug: {cat.slug}
                    </span>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                    cat.active
                      ? 'bg-emerald-950/60 text-[#20B26B] border border-emerald-800'
                      : 'bg-red-950/60 text-red-400 border border-red-800'
                  }`}
                >
                  {cat.active ? 'Visible' : 'Hidden'}
                </span>
              </div>

              {/* Actions Bar */}
              <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => handleToggleActive(cat)}
                  className="flex items-center gap-1 text-slate-400 hover:text-white cursor-pointer"
                >
                  {cat.active ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                  <span>{cat.active ? 'Hide' : 'Unhide'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(cat)}
                    className="p-1.5 rounded-lg bg-slate-700 hover:bg-[#F72585] text-white transition-colors cursor-pointer"
                    title="Edit Category"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteModalCategory(cat)}
                    className="p-1.5 rounded-lg bg-slate-700 hover:bg-red-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    title="Delete Category"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* In-App Delete Confirmation Modal (NEVER BLOCKED BY BROWSER / IFRAME) */}
      {deleteModalCategory && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-red-900/60 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-950 border border-red-800 text-red-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-black text-white">Delete Category?</h3>
              <p className="text-xs text-slate-400 mt-1">
                Are you sure you want to permanently delete{' '}
                <span className="text-white font-bold">"{deleteModalCategory.name}"</span>?
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteModalCategory(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer transition-colors flex items-center justify-center gap-1.5"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Yes, Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-black text-white">
                  {editingCategory ? `Edit: ${editingCategory.name}` : 'Add New Category'}
                </h3>
                {editingCategory && (
                  <span className="text-[10px] text-slate-500 font-mono">
                    ID: {editingCategory.id}
                  </span>
                )}
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Category / Platform Name <span className="text-[#F72585]">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!editingCategory) {
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
                    }
                  }}
                  placeholder="e.g. Instagram, Facebook, YouTube"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-[#F72585]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Slug (URL identifier)
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g. instagram"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-[#F72585]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Image URL (Platform Logo)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-[#F72585]"
                  />
                  {imageUrl && (
                    <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 p-1 shrink-0 flex items-center justify-center">
                      <img src={imageUrl} alt="preview" className="w-full h-full object-contain" />
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Inherited by all services & plans in this category automatically.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Description / Service Tags
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Followers • Likes • Views"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-[#F72585]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-[#F72585]"
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer py-2">
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={(e) => setActive(e.target.checked)}
                      className="rounded border-slate-700 text-[#F72585] focus:ring-0"
                    />
                    <span>Active / Visible</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-[#F72585] hover:bg-[#E01E75] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-pink-600/30 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Category</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
