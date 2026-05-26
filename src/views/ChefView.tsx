import { useState } from 'react';
import { ChefHat, ToggleLeft, ToggleRight, Clock, Flame, CheckCircle, XCircle, LogOut } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Order } from '../lib/database.types';

const STATUS_CONFIG = {
  ordered: { label: 'New Order', bg: 'bg-blue-50', border: 'border-blue-200', dot: 'bg-blue-500', text: 'text-blue-700' },
  cooking: { label: 'Cooking', bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-500', text: 'text-amber-700' },
  ready_to_serve: { label: 'Ready', bg: 'bg-green-50', border: 'border-green-200', dot: 'bg-green-500', text: 'text-green-700' },
  served: { label: 'Served', bg: 'bg-gray-50', border: 'border-gray-200', dot: 'bg-gray-400', text: 'text-gray-500' },
  cancelled: { label: 'Cancelled', bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-400', text: 'text-red-500' },
};

function OrderCard({ order, onUpdateStatus }: { order: Order; onUpdateStatus: (id: string, status: Order['status']) => void }) {
  const cfg = STATUS_CONFIG[order.status];
  const elapsed = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000);

  return (
    <div className={`rounded-2xl border ${cfg.bg} ${cfg.border} p-4 transition-all`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot} animate-pulse`} />
          <span className="font-black text-gray-900 text-lg">Table {order.table_id}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Clock size={12} />
          {elapsed < 1 ? 'Just now' : `${elapsed}m ago`}
        </div>
      </div>

      <div className="space-y-1.5 mb-4">
        {order.order_items?.map(oi => (
          <div key={oi.id} className="flex items-center justify-between text-sm">
            <span className="text-gray-800 font-medium">{oi.menu_items?.name}</span>
            <span className={`font-bold px-2 py-0.5 rounded-full text-xs ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
              ×{oi.quantity}
            </span>
          </div>
        ))}
      </div>

      {order.status !== 'served' && order.status !== 'cancelled' && (
        <div className="flex gap-2 flex-wrap">
          {order.status === 'ordered' && (
            <button
              onClick={() => onUpdateStatus(order.id, 'cooking')}
              className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all"
            >
              <Flame size={14} /> Start Cooking
            </button>
          )}
          {order.status === 'cooking' && (
            <button
              onClick={() => onUpdateStatus(order.id, 'ready_to_serve')}
              className="flex items-center gap-1.5 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-xs font-bold transition-all"
            >
              <CheckCircle size={14} /> Ready to Serve
            </button>
          )}
          <button
            onClick={() => onUpdateStatus(order.id, 'cancelled')}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-red-50 text-red-500 border border-red-200 rounded-xl text-xs font-bold transition-all"
          >
            <XCircle size={14} /> Cancel
          </button>
        </div>
      )}

      {(order.status === 'served' || order.status === 'cancelled') && (
        <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${cfg.text}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
          {cfg.label}
        </span>
      )}
    </div>
  );
}

export function ChefView() {
  const { menuItems, orders, updateOrderStatus, toggleMenuAvailability, logout } = useApp();
  const [tab, setTab] = useState<'queue' | 'menu'>('queue');

  const activeOrders = orders.filter(o => o.status !== 'served' && o.status !== 'cancelled');
  const newOrders = activeOrders.filter(o => o.status === 'ordered');
  const cookingOrders = activeOrders.filter(o => o.status === 'cooking');
  const readyOrders = activeOrders.filter(o => o.status === 'ready_to_serve');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-gray-900/95 backdrop-blur border-b border-gray-700 px-4 sm:px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center">
              <ChefHat size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">
                <span className="bg-gradient-to-r from-yellow-400 to-blue-400 bg-clip-text text-transparent">FreshBite</span>
                {' '}<span className="text-gray-400 font-normal text-sm">· Chef Station</span>
              </h1>
              <p className="text-xs text-gray-400">{activeOrders.length} active orders</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1 bg-gray-800 rounded-xl p-1">
              <button
                onClick={() => setTab('queue')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'queue' ? 'bg-amber-500 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                Kitchen Queue
              </button>
              <button
                onClick={() => setTab('menu')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'menu' ? 'bg-amber-500 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                Menu Control
              </button>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl text-sm font-semibold transition-all border border-gray-700 hover:border-red-500/30"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {tab === 'queue' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider">New ({newOrders.length})</h2>
              </div>
              <div className="space-y-3">
                {newOrders.map(o => (
                  <OrderCard key={o.id} order={o} onUpdateStatus={updateOrderStatus} />
                ))}
                {newOrders.length === 0 && (
                  <div className="text-center py-12 text-gray-600 text-sm">No new orders</div>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Cooking ({cookingOrders.length})</h2>
              </div>
              <div className="space-y-3">
                {cookingOrders.map(o => (
                  <OrderCard key={o.id} order={o} onUpdateStatus={updateOrderStatus} />
                ))}
                {cookingOrders.length === 0 && (
                  <div className="text-center py-12 text-gray-600 text-sm">Nothing cooking</div>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Ready ({readyOrders.length})</h2>
              </div>
              <div className="space-y-3">
                {readyOrders.map(o => (
                  <OrderCard key={o.id} order={o} onUpdateStatus={updateOrderStatus} />
                ))}
                {readyOrders.length === 0 && (
                  <div className="text-center py-12 text-gray-600 text-sm">Nothing ready yet</div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-gray-400 text-sm mb-5">Toggle items to show or hide them from the customer menu in real time.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {menuItems.map(item => (
                <div key={item.id} className={`rounded-2xl overflow-hidden border transition-all ${item.is_available ? 'border-gray-700 bg-gray-800' : 'border-gray-700 bg-gray-800/50'}`}>
                  <div className="relative h-32 overflow-hidden">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className={`w-full h-full object-cover transition-all ${item.is_available ? '' : 'grayscale opacity-40'}`}
                    />
                  </div>
                  <div className="p-3 flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className={`font-bold text-sm truncate ${item.is_available ? 'text-white' : 'text-gray-500'}`}>
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-500">{item.category}</p>
                    </div>
                    <button
                      onClick={() => toggleMenuAvailability(item.id, item.is_available)}
                      className={`flex-shrink-0 ml-2 transition-colors ${item.is_available ? 'text-green-400 hover:text-green-300' : 'text-gray-600 hover:text-gray-400'}`}
                      title={item.is_available ? 'Mark unavailable' : 'Mark available'}
                    >
                      {item.is_available ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
