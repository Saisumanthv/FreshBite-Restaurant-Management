import { useState, useEffect } from 'react';
import { UtensilsCrossed, Link } from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import { CustomerView } from './views/CustomerView';
import { ChefView } from './views/ChefView';
import { WaiterView } from './views/WaiterView';
import { ManagerView } from './views/ManagerView';
import { LoginView, RoleSelector } from './views/LoginView';
import { CartDrawer } from './components/CartDrawer';
import type { Role } from './lib/database.types';

// ─── Table QR endpoints modal ───────────────────────────────────────────────

function TableEndpointsModal({ onClose }: { onClose: () => void }) {
  const base = window.location.origin + window.location.pathname;
  const [copied, setCopied] = useState<number | null>(null);

  async function copy(url: string, tableId: number) {
    await navigator.clipboard.writeText(url);
    setCopied(tableId);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-3xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-700">
          <div>
            <h2 className="text-lg font-black text-white">Table QR Endpoints</h2>
            <p className="text-xs text-gray-400 mt-0.5">Scan to open customer view with table pre-selected</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white transition-colors text-lg leading-none">✕</button>
        </div>
        <div className="px-6 py-4 space-y-2">
          {Array.from({ length: 10 }, (_, i) => i + 1).map(t => {
            const url = `${base}?table=${t}`;
            return (
              <div key={t} className="flex items-center justify-between gap-3 bg-gray-800 rounded-xl px-4 py-3">
                <div className="min-w-0">
                  <p className="text-white font-bold text-sm">Table {t}</p>
                  <p className="text-gray-500 text-xs font-mono truncate">{url}</p>
                </div>
                <button
                  onClick={() => copy(url, t)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${copied === t ? 'bg-green-500 text-white' : 'bg-gray-700 hover:bg-amber-500 text-gray-300 hover:text-white'}`}
                >
                  {copied === t ? 'Copied!' : 'Copy'}
                </button>
              </div>
            );
          })}
        </div>
        <div className="px-6 pb-5">
          <p className="text-xs text-gray-500 bg-gray-800/50 rounded-xl px-4 py-3">
            Generate QR codes from each URL. When scanned, customers land directly on their table's menu — no login needed.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Customer view with minimal top bar ─────────────────────────────────────

function CustomerApp() {
  const { activeTableId, setActiveTableId } = useApp();
  const [endpointsOpen, setEndpointsOpen] = useState(false);

  // Read table from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = parseInt(params.get('table') ?? '', 10);
    if (t >= 1 && t <= 10) setActiveTableId(t);
  }, [setActiveTableId]);

  return (
    <>
      <CustomerView />
      <CartDrawer />
      {/* Dev helper: QR link button — only visible on localhost */}
      {window.location.hostname === 'localhost' && (
        <button
          onClick={() => setEndpointsOpen(true)}
          className="fixed bottom-4 right-4 z-30 flex items-center gap-1.5 px-3 py-2 bg-gray-900/80 backdrop-blur text-gray-300 hover:text-white border border-gray-700 rounded-xl text-xs font-semibold transition-all"
        >
          <Link size={13} /> QR Links
        </button>
      )}
      {endpointsOpen && <TableEndpointsModal onClose={() => setEndpointsOpen(false)} />}
    </>
  );
}

// ─── Staff portal (chef / waiter / manager) ──────────────────────────────────

function StaffPortal() {
  const { auth } = useApp();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  // If authenticated, show the appropriate view
  if (auth) {
    if (auth.role === 'chef') return <ChefView />;
    if (auth.role === 'waiter') return <WaiterView />;
    if (auth.role === 'manager') return <ManagerView />;
  }

  // Not authenticated — show role selector or login form
  if (!selectedRole || selectedRole === 'customer') {
    return <RoleSelector onSelect={setSelectedRole} />;
  }

  if (selectedRole === 'chef' || selectedRole === 'waiter' || selectedRole === 'manager') {
    return (
      <div>
        <LoginView role={selectedRole} />
        {/* Back link */}
        <button
          onClick={() => setSelectedRole(null)}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2"
        >
          Back to role selection
        </button>
      </div>
    );
  }

  return null;
}

// ─── Root router ─────────────────────────────────────────────────────────────

function AppContent() {
  // Determine mode: customer (QR scan / default) vs staff portal
  const isCustomer = useIsCustomerMode();

  return isCustomer ? <CustomerApp /> : <StaffPortal />;
}

function useIsCustomerMode(): boolean {
  // Customer mode when:
  // 1. URL has ?table=N  (QR scan)
  // 2. URL has ?mode=customer
  // 3. URL has NO query params at all (default landing for customers)
  // Staff portal only when ?mode=staff
  const params = new URLSearchParams(window.location.search);
  const mode = params.get('mode');
  const table = params.get('table');
  if (mode === 'staff') return false;
  if (table || mode === 'customer' || !mode) return true;
  return true;
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
