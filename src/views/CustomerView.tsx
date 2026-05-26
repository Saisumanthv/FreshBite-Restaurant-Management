import { useState, useEffect, useRef } from 'react';
import { ShoppingCart, BellRing, CheckCircle, Clock, ChefHat, Utensils, AlertCircle, Plus, XCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { OrderStatus } from '../lib/database.types';

const STATUS_STEPS: { key: OrderStatus; label: string; desc: string; icon: React.ReactNode }[] = [
  { key: 'ordered', label: 'Order Placed', desc: 'Your order has been received', icon: <CheckCircle size={16} /> },
  { key: 'cooking', label: 'Being Cooked', desc: 'Chef is preparing your food', icon: <ChefHat size={16} /> },
  { key: 'ready_to_serve', label: 'Ready', desc: 'Captain is bringing your food', icon: <Utensils size={16} /> },
  { key: 'served', label: 'Served', desc: 'Enjoy your meal!', icon: <CheckCircle size={16} /> },
];

const STATUS_ORDER: OrderStatus[] = ['ordered', 'cooking', 'ready_to_serve', 'served'];

function DetailedStatusTracker({ status }: { status: OrderStatus }) {
  const currentIdx = STATUS_ORDER.indexOf(status);

  if (status === 'cancelled') {
    return (
      <div className="mt-3 flex items-center gap-2 text-red-500 bg-red-50 px-3 py-2 rounded-xl text-sm font-semibold">
        <XCircle size={16} /> This order was cancelled by the kitchen
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      {STATUS_STEPS.map((step, i) => {
        const isDone = i < currentIdx;
        const isCurrent = i === currentIdx;
        const isPending = i > currentIdx;
        return (
          <div key={step.key} className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
            isCurrent ? 'bg-amber-50 border border-amber-200' :
            isDone ? 'bg-green-50' :
            'opacity-40'
          }`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
              isDone ? 'bg-green-500 text-white' :
              isCurrent ? 'bg-amber-500 text-white animate-pulse' :
              'bg-gray-200 text-gray-400'
            }`}>
              {step.icon}
            </div>
            <div className="min-w-0">
              <p className={`text-sm font-bold leading-tight ${
                isDone ? 'text-green-700' :
                isCurrent ? 'text-amber-700' :
                isPending ? 'text-gray-400' : 'text-gray-600'
              }`}>{step.label}</p>
              {isCurrent && (
                <p className="text-xs text-amber-600 mt-0.5">{step.desc}</p>
              )}
              {isDone && (
                <p className="text-xs text-green-600 mt-0.5">Done</p>
              )}
            </div>
            {isCurrent && (
              <div className="ml-auto">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function CategoryBadge({ cat }: { cat: string }) {
  const colors: Record<string, string> = {
    Starters: 'bg-blue-100 text-blue-700',
    Mains: 'bg-amber-100 text-amber-700',
    Desserts: 'bg-pink-100 text-pink-700',
    Sides: 'bg-green-100 text-green-700',
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colors[cat] ?? 'bg-gray-100 text-gray-600'}`}>
      {cat}
    </span>
  );
}

export function CustomerView() {
  const {
    activeTableId, menuItems, orders, cart,
    addToCart, setCartOpen, callWaiter, resolveWaiterCall, waiterCalls,
  } = useApp();
  const [callingCaptain, setCallingCaptain] = useState(false);
  const [showOnTheWay, setShowOnTheWay] = useState(false);
  const resolveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);
  const tableOrders = orders.filter(o => o.table_id === activeTableId && o.status !== 'served');
  const activeCall = waiterCalls.find(c => c.table_id === activeTableId && !c.is_resolved);
  const categories = [...new Set(menuItems.map(m => m.category))];

  // When captain acknowledges the call, show "on the way" banner for 5s then resolve
  useEffect(() => {
    if (activeCall?.is_acknowledged && !showOnTheWay) {
      setShowOnTheWay(true);
      resolveTimerRef.current = setTimeout(() => {
        resolveWaiterCall(activeCall.id);
        setShowOnTheWay(false);
      }, 5000);
    }
    return () => {
      if (resolveTimerRef.current) clearTimeout(resolveTimerRef.current);
    };
  }, [activeCall?.is_acknowledged, activeCall?.id]);

  async function handleCallCaptain() {
    if (activeCall || callingCaptain) return;
    setCallingCaptain(true);
    await callWaiter(activeTableId);
    setCallingCaptain(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-amber-50">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-amber-100 px-4 sm:px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-yellow-400 via-amber-400 to-blue-500 bg-clip-text text-transparent">
              FreshBite
            </h1>
            <p className="text-xs text-gray-500 font-medium">Table {activeTableId} · Hyderabadi Kitchen</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Captain call button */}
            <button
              onClick={handleCallCaptain}
              disabled={callingCaptain || !!activeCall}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold transition-all border ${
                activeCall
                  ? 'bg-amber-50 border-amber-300 text-amber-700 cursor-default'
                  : 'bg-gray-50 border-gray-200 hover:border-amber-300 hover:bg-amber-50 text-gray-700 hover:text-amber-700'
              }`}
            >
              <BellRing size={14} className={activeCall && !activeCall.is_acknowledged ? 'animate-bounce' : ''} />
              {activeCall ? 'Captain notified' : 'Call Captain'}
            </button>
            <button
              onClick={() => setCartOpen(true)}
              className="relative flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-white rounded-full font-bold text-sm transition-all shadow-md shadow-amber-200"
            >
              <ShoppingCart size={15} />
              Cart
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center font-black">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-8">
        {/* Phase 1: Captain called but not yet acknowledged — persists until captain attends */}
        {activeCall && !activeCall.is_acknowledged && (
          <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-amber-500 shadow-lg shadow-amber-200 text-white">
            <BellRing size={20} className="flex-shrink-0 animate-bounce" />
            <div className="flex-1">
              <p className="font-bold text-sm">Captain has been called</p>
              <p className="text-xs text-amber-100">Your request has been sent — please wait a moment.</p>
            </div>
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        {/* Phase 2: Captain acknowledged — shows for 5 seconds then clears */}
        {showOnTheWay && (
          <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-teal-500 shadow-lg shadow-teal-200 text-white">
            <BellRing size={20} className="flex-shrink-0" />
            <div className="flex-1">
              <p className="font-bold text-sm">Captain is on the way!</p>
              <p className="text-xs text-teal-100">Your captain is heading to Table {activeTableId} right now.</p>
            </div>
            <div className="flex gap-1 items-center">
              <div className="w-2 h-2 rounded-full bg-white animate-ping" />
              <span className="text-xs font-bold text-teal-100 ml-1">Coming</span>
            </div>
          </div>
        )}

        {/* Active Orders */}
        {tableOrders.length > 0 && (
          <section>
            <h2 className="text-base font-black text-gray-800 mb-3 flex items-center gap-2">
              <Clock size={16} className="text-amber-500" />
              Your Active Orders
              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-black rounded-full">{tableOrders.length}</span>
            </h2>
            <div className="space-y-3">
              {tableOrders.map(order => (
                <div key={order.id} className="bg-white rounded-2xl p-4 shadow-sm border border-amber-100">
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <p className="text-xs text-gray-400">
                        Ordered at {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <div className="flex flex-wrap gap-x-3 mt-1">
                        {order.order_items?.map(oi => {
                          const available = oi.menu_items?.is_available;
                          return (
                            <span key={oi.id} className={`text-sm font-semibold flex items-center gap-1 ${available === false ? 'text-red-500 line-through' : 'text-gray-800'}`}>
                              {oi.menu_items?.name} ×{oi.quantity}
                              {available === false && (
                                <span className="text-xs font-bold no-underline text-red-500">(unavailable)</span>
                              )}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <DetailedStatusTracker status={order.status} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Menu */}
        {categories.map(cat => (
          <section key={cat}>
            <h2 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
              <CategoryBadge cat={cat} />
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {menuItems.filter(m => m.category === cat).map(item => (
                <div
                  key={item.id}
                  className={`group rounded-2xl overflow-hidden shadow-sm border transition-all duration-300 ${
                    item.is_available
                      ? 'bg-white border-gray-100 hover:shadow-md hover:-translate-y-0.5'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="relative overflow-hidden h-44">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className={`w-full h-full object-cover transition-all duration-500 ${
                        item.is_available ? 'group-hover:scale-105' : 'grayscale'
                      }`}
                    />
                    {!item.is_available && (
                      <div className="absolute inset-0 bg-black/65 flex flex-col items-center justify-center gap-1">
                        <XCircle size={24} className="text-white/80" />
                        <span className="bg-white text-gray-900 text-xs font-black px-3 py-1 rounded-full tracking-wider uppercase">
                          Currently Unavailable
                        </span>
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <CategoryBadge cat={item.category} />
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className={`font-bold text-base ${item.is_available ? 'text-gray-900' : 'text-gray-400'}`}>
                      {item.name}
                    </h3>
                    <p className={`text-xs mt-1 leading-relaxed line-clamp-2 ${item.is_available ? 'text-gray-500' : 'text-gray-400'}`}>
                      {item.ingredients.join(', ')}
                    </p>
                    {item.is_available ? (
                      <button
                        onClick={() => addToCart(item)}
                        className="mt-3 w-full py-2.5 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm"
                      >
                        <Plus size={16} /> Add to Order
                      </button>
                    ) : (
                      <div className="mt-3 w-full py-2.5 bg-gray-100 text-gray-400 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 cursor-not-allowed">
                        <AlertCircle size={14} /> Not Available Right Now
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Staff portal link */}
      <div className="text-center py-8">
        <a
          href="?mode=staff"
          className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors"
        >
          Staff Login
        </a>
      </div>
    </div>
  );
}
