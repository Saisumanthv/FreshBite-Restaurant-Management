import { X, Minus, Plus, ShoppingBag, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

export function CartDrawer() {
  const { cart, cartOpen, setCartOpen, removeFromCart, updateCartQty, placeOrder, placingOrder, activeTableId } = useApp();

  if (!cartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
      <div className="w-full max-w-md bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-black text-gray-900">Your Order</h2>
            <p className="text-sm text-gray-500 mt-0.5">Table {activeTableId}</p>
          </div>
          <button
            onClick={() => setCartOpen(false)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
              <ShoppingBag size={48} strokeWidth={1.5} />
              <p className="text-base">Your cart is empty</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map(item => (
                <div key={item.menu_item.id} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50">
                  <img
                    src={item.menu_item.image_url}
                    alt={item.menu_item.name}
                    className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{item.menu_item.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{item.menu_item.category}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateCartQty(item.menu_item.id, -1)}
                      className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors shadow-sm"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="w-6 text-center font-black text-sm">{item.quantity}</span>
                    <button
                      onClick={() => updateCartQty(item.menu_item.id, 1)}
                      className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center hover:bg-amber-600 transition-colors shadow-sm"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="px-6 py-5 border-t border-gray-100 space-y-3">
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span>{cart.reduce((s, c) => s + c.quantity, 0)} item(s)</span>
              <span>Table {activeTableId}</span>
            </div>
            <button
              onClick={placeOrder}
              disabled={placingOrder}
              className="w-full py-4 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 disabled:opacity-60 text-white font-black text-base rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-200"
            >
              {placingOrder ? (
                <><Loader2 size={20} className="animate-spin" /> Placing Order...</>
              ) : (
                'Place Order'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
