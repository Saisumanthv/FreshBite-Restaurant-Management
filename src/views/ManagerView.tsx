import { useState, useRef, useEffect } from 'react';
import { BarChart3, TrendingUp, Clock, CheckCircle, Flame, AlertTriangle, RefreshCw, Plus, X, Trash2, Image as ImageIcon, LogOut, Eye, EyeOff, Key, Pencil, RotateCcw, History, ChevronDown, ChevronUp, Users, Menu } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { OrderStatus, NewMenuItem, MenuItem, SessionSnapshot } from '../lib/database.types';

const STATUS_LABELS: Record<OrderStatus, string> = {
  ordered: 'Ordered', cooking: 'Cooking', ready_to_serve: 'Ready', served: 'Served', cancelled: 'Cancelled',
};
const STATUS_STYLES: Record<OrderStatus, string> = {
  ordered: 'bg-blue-100 text-blue-700', cooking: 'bg-amber-100 text-amber-700',
  ready_to_serve: 'bg-green-100 text-green-700', served: 'bg-gray-100 text-gray-500', cancelled: 'bg-red-100 text-red-500',
};
const DEFAULT_CATEGORIES = ['Starters', 'Mains', 'Sides', 'Desserts', 'Drinks', 'Specials'];

const CUSTOM_CATS_KEY = 'flashbite_custom_categories';

function loadCustomCats(): string[] {
  try { return JSON.parse(localStorage.getItem(CUSTOM_CATS_KEY) ?? '[]'); }
  catch { return []; }
}
function saveCustomCats(cats: string[]) {
  localStorage.setItem(CUSTOM_CATS_KEY, JSON.stringify(cats));
}

function CategorySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { menuItems, updateMenuItem } = useApp();
  const [customCats, setCustomCats] = useState<string[]>(loadCustomCats);
  const [addingNew, setAddingNew] = useState(false);
  const [newCat, setNewCat] = useState('');
  const [deletingCat, setDeletingCat] = useState<string | null>(null);
  const [reassignTo, setReassignTo] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Merge: defaults + custom (persisted) + any categories already on menu items
  const existingCats = [...new Set([...DEFAULT_CATEGORIES, ...customCats, ...menuItems.map(m => m.category)])];

  function confirmNew() {
    const trimmed = newCat.trim();
    if (!trimmed) return;
    if (!existingCats.includes(trimmed)) {
      const updated = [...customCats, trimmed];
      setCustomCats(updated);
      saveCustomCats(updated);
    }
    onChange(trimmed);
    setAddingNew(false);
    setNewCat('');
  }

  function startDelete(cat: string) {
    const others = existingCats.filter(c => c !== cat);
    setReassignTo(others[0] ?? '');
    setDeletingCat(cat);
  }

  async function confirmDelete() {
    if (!deletingCat) return;
    setDeleting(true);
    const affected = menuItems.filter(m => m.category === deletingCat);
    await Promise.all(
      affected.map(m => updateMenuItem(m.id, { ...m, ingredients: [...m.ingredients], category: reassignTo }))
    );
    if (value === deletingCat) onChange(reassignTo);
    const updated = customCats.filter(c => c !== deletingCat);
    setCustomCats(updated);
    saveCustomCats(updated);
    setDeletingCat(null);
    setDeleting(false);
  }

  // Delete confirmation overlay
  if (deletingCat) {
    const affected = menuItems.filter(m => m.category === deletingCat);
    const othersForReassign = existingCats.filter(c => c !== deletingCat);
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-3">
        <div className="flex items-start gap-2">
          <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-700">Delete "{deletingCat}"?</p>
            {affected.length > 0 ? (
              <p className="text-xs text-red-600 mt-0.5">
                {affected.length} item{affected.length > 1 ? 's' : ''} will be moved to another category.
              </p>
            ) : (
              <p className="text-xs text-red-600 mt-0.5">No items in this category.</p>
            )}
          </div>
        </div>
        {affected.length > 0 && (
          <div>
            <label className="block text-xs font-bold text-red-700 mb-1">Reassign items to</label>
            <select value={reassignTo} onChange={e => setReassignTo(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-red-200 bg-white text-sm font-medium outline-none focus:border-red-400">
              {othersForReassign.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}
        <div className="flex gap-2">
          <button type="button" onClick={() => setDeletingCat(null)}
            className="flex-1 py-2 border border-gray-200 hover:bg-white text-gray-600 rounded-xl text-xs font-bold transition-all">
            Cancel
          </button>
          <button type="button" onClick={confirmDelete} disabled={deleting || (affected.length > 0 && !reassignTo)}
            className="flex-1 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5">
            {deleting ? <RefreshCw size={13} className="animate-spin" /> : <Trash2 size={13} />}
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    );
  }

  if (addingNew) {
    return (
      <div className="flex gap-2">
        <input
          autoFocus
          type="text"
          value={newCat}
          onChange={e => setNewCat(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); confirmNew(); } if (e.key === 'Escape') { setAddingNew(false); setNewCat(''); } }}
          placeholder="New category name"
          className="flex-1 px-4 py-3 rounded-xl border border-amber-300 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none text-sm font-medium transition-all"
        />
        <button type="button" onClick={confirmNew} className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-sm transition-all">Add</button>
        <button type="button" onClick={() => { setAddingNew(false); setNewCat(''); }} className="px-3 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl text-sm transition-all"><X size={15} /></button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <select value={value} onChange={e => onChange(e.target.value)}
          className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none text-sm font-medium transition-all bg-white">
          {existingCats.map(c => <option key={c} value={c}>{c}</option>)}
          {!existingCats.includes(value) && <option value={value}>{value}</option>}
        </select>
        <button type="button" onClick={() => setAddingNew(true)}
          className="flex items-center gap-1.5 px-3 py-2.5 border border-dashed border-amber-300 hover:border-amber-400 hover:bg-amber-50 text-amber-600 rounded-xl text-xs font-bold transition-all whitespace-nowrap">
          <Plus size={13} /> New
        </button>
        <button type="button" onClick={() => startDelete(value)}
          title={`Delete "${value}" category`}
          className="flex items-center justify-center px-3 py-2.5 border border-dashed border-red-200 hover:border-red-400 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-xl text-xs font-bold transition-all">
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <div className={`rounded-2xl p-5 border ${color}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-500">{label}</p>
          <p className="text-4xl font-black text-gray-900 mt-1">{value}</p>
        </div>
        <div className="p-2.5 rounded-xl bg-white/60">{icon}</div>
      </div>
    </div>
  );
}

const EMPTY_FORM: NewMenuItem = { name: '', ingredients: [], image_url: '', category: 'Mains', is_available: true };

function AddMenuItemModal({ onClose }: { onClose: () => void }) {
  const { addMenuItem } = useApp();
  const [form, setForm] = useState<NewMenuItem>(EMPTY_FORM);
  const [ingredientInput, setIngredientInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function addIngredient() {
    const t = ingredientInput.trim();
    if (!t) return;
    setForm(f => ({ ...f, ingredients: [...f.ingredients, t] }));
    setIngredientInput('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) { setError('Name is required'); return; }
    if (!form.image_url.trim()) { setError('Image URL is required'); return; }
    if (form.ingredients.length === 0) { setError('Add at least one ingredient'); return; }
    setSaving(true);
    try { await addMenuItem(form); onClose(); }
    catch { setError('Failed to add item. Please try again.'); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-xl font-black text-gray-900">Add Menu Item</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors"><X size={20} className="text-gray-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Dish Name *</label>
            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Shahi Tukda"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none text-sm font-medium transition-all" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Category *</label>
            <CategorySelect value={form.category} onChange={v => setForm(f => ({ ...f, category: v }))} />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              <span className="flex items-center gap-1.5"><ImageIcon size={14} /> Image URL (Pexels recommended) *</span>
            </label>
            <input type="url" value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://images.pexels.com/..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none text-sm font-medium transition-all" />
            {form.image_url && (
              <div className="mt-2 h-28 rounded-xl overflow-hidden border border-gray-200">
                <img src={form.image_url} alt="preview" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Ingredients *</label>
            <div className="flex gap-2">
              <input type="text" value={ingredientInput} onChange={e => setIngredientInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addIngredient(); } }}
                placeholder="Type ingredient and press Enter"
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none text-sm transition-all" />
              <button type="button" onClick={addIngredient} className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-sm transition-all">Add</button>
            </div>
            {form.ingredients.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {form.ingredients.map((ing, i) => (
                  <span key={i} className="flex items-center gap-1 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold rounded-full">
                    {ing}
                    <button type="button" onClick={() => setForm(f => ({ ...f, ingredients: f.ingredients.filter((_, idx) => idx !== i) }))} className="hover:text-red-500 transition-colors"><X size={12} /></button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="text-sm font-bold text-gray-700">Available on menu</p>
              <p className="text-xs text-gray-500 mt-0.5">Customers can see and order this item</p>
            </div>
            <button type="button" onClick={() => setForm(f => ({ ...f, is_available: !f.is_available }))}
              className={`relative w-12 h-6 rounded-full transition-all ${form.is_available ? 'bg-green-500' : 'bg-gray-300'}`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.is_available ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
          {error && <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-xl text-sm font-semibold"><AlertTriangle size={16} /> {error}</div>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-3 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-bold text-sm transition-all">Cancel</button>
            <button type="submit" disabled={saving}
              className="flex-1 py-3 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 disabled:opacity-60 text-white rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2">
              {saving ? <RefreshCw size={16} className="animate-spin" /> : <Plus size={16} />}
              {saving ? 'Adding...' : 'Add to Menu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


function EditMenuItemModal({ item, onClose }: { item: MenuItem; onClose: () => void }) {
  const { updateMenuItem } = useApp();
  const [form, setForm] = useState<NewMenuItem>({
    name: item.name,
    ingredients: [...item.ingredients],
    image_url: item.image_url,
    category: item.category,
    is_available: item.is_available,
  });
  const [ingredientInput, setIngredientInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function addIngredient() {
    const t = ingredientInput.trim();
    if (!t) return;
    setForm(f => ({ ...f, ingredients: [...f.ingredients, t] }));
    setIngredientInput('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) { setError('Name is required'); return; }
    if (!form.image_url.trim()) { setError('Image URL is required'); return; }
    if (form.ingredients.length === 0) { setError('Add at least one ingredient'); return; }
    setSaving(true);
    try { await updateMenuItem(item.id, form); onClose(); }
    catch { setError('Failed to save changes. Please try again.'); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-black text-gray-900">Edit Menu Item</h2>
            <p className="text-xs text-gray-500 mt-0.5">{item.name}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors"><X size={20} className="text-gray-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Dish Name *</label>
            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Shahi Tukda"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none text-sm font-medium transition-all" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Category *</label>
            <CategorySelect value={form.category} onChange={v => setForm(f => ({ ...f, category: v }))} />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              <span className="flex items-center gap-1.5"><ImageIcon size={14} /> Image URL (Pexels recommended) *</span>
            </label>
            <input type="url" value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://images.pexels.com/..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none text-sm font-medium transition-all" />
            {form.image_url && (
              <div className="mt-2 h-36 rounded-xl overflow-hidden border border-gray-200">
                <img src={form.image_url} alt="preview" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Ingredients *</label>
            <div className="flex gap-2">
              <input type="text" value={ingredientInput} onChange={e => setIngredientInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addIngredient(); } }}
                placeholder="Type ingredient and press Enter"
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none text-sm transition-all" />
              <button type="button" onClick={addIngredient} className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-sm transition-all">Add</button>
            </div>
            {form.ingredients.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {form.ingredients.map((ing, i) => (
                  <span key={i} className="flex items-center gap-1 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold rounded-full">
                    {ing}
                    <button type="button" onClick={() => setForm(f => ({ ...f, ingredients: f.ingredients.filter((_, idx) => idx !== i) }))} className="hover:text-red-500 transition-colors"><X size={12} /></button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="text-sm font-bold text-gray-700">Available on menu</p>
              <p className="text-xs text-gray-500 mt-0.5">Customers can see and order this item</p>
            </div>
            <button type="button" onClick={() => setForm(f => ({ ...f, is_available: !f.is_available }))}
              className={`relative w-12 h-6 rounded-full transition-all ${form.is_available ? 'bg-green-500' : 'bg-gray-300'}`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.is_available ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
          {error && <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-xl text-sm font-semibold"><AlertTriangle size={16} /> {error}</div>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-3 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-bold text-sm transition-all">Cancel</button>
            <button type="submit" disabled={saving}
              className="flex-1 py-3 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 disabled:opacity-60 text-white rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2">
              {saving ? <RefreshCw size={16} className="animate-spin" /> : <Pencil size={16} />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RolePasswordRow({ label, currentPw, onSave }: { label: string; currentPw: string; onSave: (pw: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [pw, setPw] = useState(currentPw);
  const [showPw, setShowPw] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4">
      <div className="flex-1">
        <p className="font-black text-gray-900 text-sm">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">Fixed role</p>
      </div>
      {editing ? (
        <div className="flex items-center gap-2">
          <div className="relative">
            <input type={showPw ? 'text' : 'password'} value={pw} onChange={e => setPw(e.target.value)}
              className="w-44 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-mono outline-none focus:border-amber-400 pr-8" />
            <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
              {showPw ? <EyeOff size={12} /> : <Eye size={12} />}
            </button>
          </div>
          <button onClick={() => { onSave(pw); setEditing(false); }}
            className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-bold">Save</button>
          <button onClick={() => { setPw(currentPw); setEditing(false); }}
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-bold">Cancel</button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5">
            <Key size={12} className="text-gray-400" />
            <span className="text-xs font-mono text-gray-600">{showPw ? currentPw : '••••••••••'}</span>
            <button onClick={() => setShowPw(v => !v)} className="text-gray-400 hover:text-gray-600 ml-1">
              {showPw ? <EyeOff size={12} /> : <Eye size={12} />}
            </button>
          </div>
          <button onClick={() => setEditing(true)} className="p-1.5 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all">
            <Pencil size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

function SnapshotCard({ snap, index }: { snap: SessionSnapshot; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50/60 transition-colors text-left"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
            #{snap.session_index}
          </div>
          <div>
            <p className="font-black text-gray-900 text-sm">Session {snap.session_index}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {new Date(snap.snapshot_date).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })}
              {' · '}
              {new Date(snap.snapshot_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-6 mr-2">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-gray-400">Total</p>
            <p className="font-black text-gray-900">{snap.total_orders}</p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-xs text-gray-400">Served</p>
            <p className="font-black text-green-600">{snap.orders_served}</p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-xs text-gray-400">Cancelled</p>
            <p className="font-black text-red-500">{snap.orders_cancelled}</p>
          </div>
          {expanded ? <ChevronUp size={16} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 px-5 py-5 space-y-5 bg-gray-50/40">
          {/* Summary Pills */}
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold rounded-full">{snap.total_orders} Total Orders</span>
            <span className="px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 text-xs font-bold rounded-full">{snap.orders_served} Served</span>
            <span className="px-3 py-1.5 bg-red-50 border border-red-200 text-red-600 text-xs font-bold rounded-full">{snap.orders_cancelled} Cancelled</span>
            {snap.orders_cooking > 0 && <span className="px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold rounded-full">{snap.orders_cooking} Left in Kitchen</span>}
            {snap.orders_pending > 0 && <span className="px-3 py-1.5 bg-gray-100 border border-gray-200 text-gray-600 text-xs font-bold rounded-full">{snap.orders_pending} Pending</span>}
          </div>

          {/* Captain Performance */}
          {snap.waiter_summary.length > 0 && (
            <div>
              <h4 className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Users size={12} /> Captain Performance
              </h4>
              <div className="space-y-2">
                {snap.waiter_summary.map((w, i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white font-black text-xs flex-shrink-0">
                      {w.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 text-sm">{w.name}</p>
                    </div>
                    <div className="flex gap-4 text-xs">
                      <span className="text-gray-500">Served: <span className="font-black text-green-600">{w.orders_served}</span></span>
                      <span className="text-gray-500">Calls: <span className="font-black text-teal-600">{w.calls_attended}</span></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Table Summary */}
          {snap.table_summary.length > 0 && (
            <div>
              <h4 className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Table Activity</h4>
              <div className="flex flex-wrap gap-2">
                {snap.table_summary.map(t => (
                  <div key={t.table_id} className="bg-white rounded-xl border border-gray-100 px-3 py-2 text-center min-w-[64px]">
                    <p className="text-xs text-gray-500 font-semibold">T{t.table_id}</p>
                    <p className="font-black text-gray-900 text-sm">{t.order_count}</p>
                    <p className="text-xs text-gray-400">{t.items_count} items</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ManagerView() {
  const { orders, menuItems, waiterCalls, roleCredentials, deleteMenuItem, updateRolePassword, logout, resetSession, snapshots } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [tab, setTab] = useState<'dashboard' | 'menu' | 'staff' | 'history'>('dashboard');
  const [resetting, setResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleReset() {
    setResetting(true);
    try { await resetSession(); } finally {
      setResetting(false);
      setShowResetConfirm(false);
    }
  }

  const totalActive = orders.filter(o => ['ordered', 'cooking', 'ready_to_serve'].includes(o.status)).length;
  const cooking = orders.filter(o => o.status === 'cooking').length;
  const served = orders.filter(o => o.status === 'served').length;
  const cancelled = orders.filter(o => o.status === 'cancelled').length;
  const unavailableItems = menuItems.filter(m => !m.is_available).length;

  const tableStats = Array.from({ length: 10 }, (_, i) => {
    const tableOrders = orders.filter(o => o.table_id === i + 1);
    const active = tableOrders.filter(o => ['ordered', 'cooking', 'ready_to_serve'].includes(o.status));
    const hasPendingCall = waiterCalls.some(c => c.table_id === i + 1 && !c.is_resolved);
    return { tableId: i + 1, active, hasPendingCall };
  });

  const recentOrders = [...orders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 20);

  const chefCred = roleCredentials.find(c => c.role === 'chef');
  const managerCred = roleCredentials.find(c => c.role === 'manager');
  const captainCred = roleCredentials.find(c => c.role === 'waiter');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center flex-shrink-0">
              <BarChart3 size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black">
                <span className="bg-gradient-to-r from-yellow-400 to-blue-500 bg-clip-text text-transparent">FreshBite</span>
                {' '}<span className="text-gray-500 font-normal text-sm">· Manager</span>
              </h1>
              {/* <p className="text-xs text-gray-500 flex items-center gap-1"><RefreshCw size={11} className="animate-spin" /> Live · 5s refresh</p> */}
            </div>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-2">
            <div className="flex gap-0.5 bg-gray-100 rounded-xl p-1">
              {(['dashboard', 'menu', 'staff', 'history'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all capitalize ${tab === t ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                  {t === 'history' ? <span className="flex items-center gap-1"><History size={13} /> History</span> : t}
                </button>
              ))}
            </div>
            <button onClick={() => setShowResetConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-amber-600 hover:text-white hover:bg-amber-500 rounded-xl text-sm font-semibold transition-all border border-amber-300 hover:border-amber-500">
              <RotateCcw size={15} /> Reset
            </button>
            <button onClick={logout}
              className="flex items-center gap-1.5 px-3 py-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-xl text-sm font-semibold transition-all border border-gray-200 hover:border-red-200">
              <LogOut size={15} /> Sign Out
            </button>
          </div>

          {/* Mobile hamburger */}
          <div className="md:hidden relative" ref={menuRef}>
            <button onClick={() => setMenuOpen(v => !v)}
              className={`p-2.5 rounded-xl border transition-all ${menuOpen ? 'bg-slate-700 border-slate-700 text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-30">
                {/* Tab items */}
                <div className="p-2 space-y-0.5">
                  {(['dashboard', 'menu', 'staff', 'history'] as const).map(t => (
                    <button key={t} onClick={() => { setTab(t); setMenuOpen(false); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all capitalize text-left ${tab === t ? 'bg-slate-700 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                      {t === 'dashboard' && <BarChart3 size={15} />}
                      {t === 'menu' && <Plus size={15} />}
                      {t === 'staff' && <Key size={15} />}
                      {t === 'history' && <History size={15} />}
                      {t === 'history' ? 'History' : t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
                {/* Divider */}
                <div className="border-t border-gray-100 p-2 space-y-0.5">
                  <button onClick={() => { setShowResetConfirm(true); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-amber-600 hover:bg-amber-50 transition-all text-left">
                    <RotateCcw size={15} /> Reset Session
                  </button>
                  <button onClick={logout}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-all text-left">
                    <LogOut size={15} /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-8">
        {/* DASHBOARD TAB */}
        {tab === 'dashboard' && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Active Orders" value={totalActive} color="bg-blue-50 border-blue-200" icon={<TrendingUp size={20} className="text-blue-600" />} />
              <StatCard label="In Kitchen" value={cooking} color="bg-amber-50 border-amber-200" icon={<Flame size={20} className="text-amber-600" />} />
              <StatCard label="Completed" value={served} color="bg-green-50 border-green-200" icon={<CheckCircle size={20} className="text-green-600" />} />
              <StatCard label="Cancelled" value={cancelled} color="bg-red-50 border-red-200" icon={<AlertTriangle size={20} className="text-red-500" />} />
            </div>

            {(() => { const pendingCalls = waiterCalls.filter(c => !c.is_resolved); return (pendingCalls.length > 0 || unavailableItems > 0) && (
              <div className="flex flex-wrap gap-3">
                {pendingCalls.length > 0 && (
                  <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-4 py-2 text-sm font-semibold text-amber-700">
                    <AlertTriangle size={14} /> {pendingCalls.length} pending captain call{pendingCalls.length > 1 ? 's' : ''}
                  </div>
                )}
                {unavailableItems > 0 && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-full px-4 py-2 text-sm font-semibold text-red-600">
                    <AlertTriangle size={14} /> {unavailableItems} menu item{unavailableItems > 1 ? 's' : ''} unavailable
                  </div>
                )}
              </div>
            ); })()}

            {/* Captain performance summary */}
            {(() => {
              const totalServed = orders.filter(o => o.status === 'served').length;
              const totalAttended = waiterCalls.filter(c => c.is_acknowledged).length;
              return (
                <section>
                  <h2 className="text-base font-black text-gray-800 mb-4 flex items-center gap-2">
                    <CheckCircle size={16} className="text-teal-600" /> Captain Performance Today
                  </h2>
                  <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white font-black text-base flex-shrink-0">
                      C
                    </div>
                    <div>
                      <p className="font-black text-gray-900">Captain</p>
                      <div className="flex gap-4 mt-1">
                        <span className="text-xs text-gray-500">Tables attended: <span className="font-bold text-teal-600">{totalAttended}</span></span>
                        <span className="text-xs text-gray-500">Orders served: <span className="font-bold text-green-600">{totalServed}</span></span>
                      </div>
                    </div>
                  </div>
                </section>
              );
            })()}

            {/* Table Grid */}
            <section>
              <h2 className="text-base font-black text-gray-800 mb-4">Table Status</h2>
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">
                {tableStats.map(({ tableId, active, hasPendingCall }) => (
                  <div key={tableId} className={`relative rounded-xl p-3 text-center border transition-all ${active.length > 0 ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200'}`}>
                    {hasPendingCall && <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full animate-pulse border-2 border-white" />}
                    <p className="text-xs text-gray-500 font-semibold">T{tableId}</p>
                    <p className={`text-lg font-black ${active.length > 0 ? 'text-blue-600' : 'text-gray-300'}`}>{active.length > 0 ? active.length : '—'}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">Numbers = active orders. Amber dot = captain call pending.</p>
            </section>

            {/* Live Order Feed */}
            <section>
              <h2 className="text-base font-black text-gray-800 mb-4 flex items-center gap-2">
                <Clock size={16} className="text-slate-600" /> Live Order Feed
              </h2>
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                {recentOrders.length === 0 ? (
                  <div className="p-12 text-center text-gray-400 text-sm">No orders yet</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/70">
                          <th className="text-left px-4 py-3 text-xs font-black text-gray-500 uppercase tracking-wider">Time</th>
                          <th className="text-left px-4 py-3 text-xs font-black text-gray-500 uppercase tracking-wider">Table</th>
                          <th className="text-left px-4 py-3 text-xs font-black text-gray-500 uppercase tracking-wider">Items</th>
                          <th className="text-left px-4 py-3 text-xs font-black text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="text-left px-4 py-3 text-xs font-black text-gray-500 uppercase tracking-wider">Served by</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {recentOrders.map(order => (
                          <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-4 py-3 text-gray-500 whitespace-nowrap font-mono text-xs">
                              {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </td>
                            <td className="px-4 py-3 font-black text-gray-900">Table {order.table_id}</td>
                            <td className="px-4 py-3 text-gray-600 max-w-xs truncate">
                              {order.order_items?.map(oi => `${oi.menu_items?.name} ×${oi.quantity}`).join(', ') || '—'}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[order.status]}`}>{STATUS_LABELS[order.status]}</span>
                            </td>
                            <td className="px-4 py-3 text-gray-500 text-xs">
                              {order.status === 'served' ? 'Captain' : ''}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          </>
        )}

        {/* MENU TAB */}
        {tab === 'menu' && (
          <section>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-black text-gray-800">Menu Items</h2>
                <p className="text-xs text-gray-500 mt-0.5">{menuItems.length} items · {unavailableItems} unavailable</p>
              </div>
              <button onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-white rounded-xl font-bold text-sm transition-all shadow-sm">
                <Plus size={16} /> Add New Item
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {menuItems.map(item => (
                <div key={item.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all">
                  <div className="relative h-36">
                    <img src={item.image_url} alt={item.name} className={`w-full h-full object-cover ${item.is_available ? '' : 'grayscale opacity-60'}`} />
                    <div className="absolute top-2 right-2">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${item.is_available ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}>
                        {item.is_available ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                    <div className="absolute top-2 left-2">
                      <span className="text-xs font-bold px-2 py-1 rounded-full bg-black/50 text-white">{item.category}</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-black text-gray-900 text-sm">{item.name}</h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.ingredients.join(', ')}</p>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <button onClick={() => setEditingItem(item)}
                        className="flex items-center gap-1 px-3 py-1.5 text-amber-600 hover:bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold transition-all">
                        <Pencil size={12} /> Edit
                      </button>
                      <button onClick={() => { if (window.confirm(`Remove "${item.name}" from the menu?`)) deleteMenuItem(item.id); }}
                        className="flex items-center gap-1 px-3 py-1.5 text-red-500 hover:bg-red-50 border border-red-200 rounded-xl text-xs font-bold transition-all">
                        <Trash2 size={12} /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* HISTORY TAB */}
        {tab === 'history' && (
          <section>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-black text-gray-800 flex items-center gap-2"><History size={16} className="text-slate-600" /> Previous Stats</h2>
                <p className="text-xs text-gray-500 mt-0.5">{snapshots.length} session{snapshots.length !== 1 ? 's' : ''} archived</p>
              </div>
            </div>
            {snapshots.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
                <History size={32} className="text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 font-semibold text-sm">No previous sessions yet</p>
                <p className="text-gray-300 text-xs mt-1">Use the Reset button to archive the current session</p>
              </div>
            ) : (
              <div className="space-y-3">
                {snapshots.map((snap, i) => (
                  <SnapshotCard key={snap.id} snap={snap} index={i} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* STAFF TAB */}
        {tab === 'staff' && (
          <div className="space-y-8">
            {/* Role Passwords */}
            <section>
              <h2 className="text-base font-black text-gray-800 mb-4 flex items-center gap-2">
                <Key size={16} className="text-slate-600" /> Role Passwords
              </h2>
              <div className="space-y-3">
                {chefCred && (
                  <RolePasswordRow label="Chef" currentPw={chefCred.password}
                    onSave={(pw) => updateRolePassword('chef', pw)} />
                )}
                {captainCred && (
                  <RolePasswordRow label="Captain" currentPw={captainCred.password}
                    onSave={(pw) => updateRolePassword('waiter', pw)} />
                )}
                {managerCred && (
                  <RolePasswordRow label="Manager (You)" currentPw={managerCred.password}
                    onSave={(pw) => updateRolePassword('manager', pw)} />
                )}
              </div>
            </section>
          </div>
        )}
      </div>

      {showAddModal && <AddMenuItemModal onClose={() => setShowAddModal(false)} />}
      {editingItem && <EditMenuItemModal item={editingItem} onClose={() => setEditingItem(null)} />}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <RotateCcw size={22} className="text-amber-600" />
              </div>
              <div>
                <h2 className="text-lg font-black text-gray-900">Reset Session?</h2>
                <p className="text-xs text-gray-500 mt-0.5">This will archive all current data</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              All orders, waiter calls, and activity will be cleared from all views (Manager, Chef, Waiter). A snapshot will be saved under <span className="font-bold text-gray-800">History</span> so nothing is lost.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowResetConfirm(false)} disabled={resetting}
                className="flex-1 py-3 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-bold text-sm transition-all">
                Cancel
              </button>
              <button onClick={handleReset} disabled={resetting}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2">
                {resetting ? <RefreshCw size={16} className="animate-spin" /> : <RotateCcw size={16} />}
                {resetting ? 'Resetting...' : 'Yes, Reset'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
