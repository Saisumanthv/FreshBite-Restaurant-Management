import { Bell, CheckCircle, Utensils, Clock, BellOff, Navigation, LogOut } from 'lucide-react';
import { useApp } from '../context/AppContext';

export function WaiterView() {
  const { orders, waiterCalls, markServed, acknowledgeWaiterCall, auth, logout } = useApp();

  const waiter = auth?.waiter;
  const readyOrders = orders.filter(o => o.status === 'ready_to_serve');
  const servedByMe = orders.filter(o => o.status === 'served');
  const activeOrders = orders.filter(o => ['ordered', 'cooking', 'ready_to_serve'].includes(o.status));

  const pendingCalls = waiterCalls.filter(c => !c.is_resolved && !c.is_acknowledged);

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-sky-50">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-teal-100 px-4 sm:px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500 flex items-center justify-center">
              <Utensils size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black">
                <span className="bg-gradient-to-r from-yellow-400 to-blue-500 bg-clip-text text-transparent">FreshBite</span>
                {' '}<span className="text-gray-500 font-normal text-sm">· Captain</span>
              </h1>
              <p className="text-xs text-teal-700 font-bold">Captain</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-2 text-center">
              <div className="px-3 py-1.5 bg-teal-50 rounded-xl">
                <p className="text-lg font-black text-teal-600">{readyOrders.length}</p>
                <p className="text-xs text-gray-500">Ready</p>
              </div>
              <div className="px-3 py-1.5 bg-green-50 rounded-xl">
                <p className="text-lg font-black text-green-600">{servedByMe.length}</p>
                <p className="text-xs text-gray-500">Served</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-xl text-sm font-semibold transition-all border border-gray-200 hover:border-red-200"
            >
              <LogOut size={15} /> Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-8">

        {/* New unacknowledged calls */}
        {pendingCalls.length > 0 && (
          <section>
            <h2 className="text-base font-black text-gray-800 mb-3 flex items-center gap-2">
              <Bell size={16} className="text-amber-500 animate-bounce" />
              New Assistance Requests
              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-black rounded-full">{pendingCalls.length}</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {pendingCalls.map(call => (
                <div key={call.id} className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                  <div>
                    <p className="font-black text-amber-800 text-xl">Table {call.table_id}</p>
                    <p className="text-xs text-amber-600 flex items-center gap-1 mt-0.5">
                      <Clock size={11} />
                      {new Date(call.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <button
                    onClick={() => acknowledgeWaiterCall(call.id)}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95"
                  >
                    <Navigation size={15} /> Attend
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}



        {waiterCalls.filter(c => !c.is_resolved).length === 0 && (
          <div className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 px-5 py-4 text-gray-400 text-sm">
            <BellOff size={18} strokeWidth={1.5} /> No assistance requests right now
          </div>
        )}

        {/* Ready to Serve */}
        <section>
          <h2 className="text-base font-black text-gray-800 mb-3 flex items-center gap-2">
            <CheckCircle size={16} className="text-green-500" />
            Ready to Serve
            {readyOrders.length > 0 && (
              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-black rounded-full">{readyOrders.length}</span>
            )}
          </h2>
          {readyOrders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 flex flex-col items-center gap-3 text-gray-400">
              <BellOff size={32} strokeWidth={1.5} />
              <p className="text-sm">No orders ready right now</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {readyOrders.map(order => (
                <div key={order.id} className="bg-white rounded-2xl border border-green-200 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                      <span className="font-black text-gray-900 text-xl">Table {order.table_id}</span>
                    </div>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock size={11} />
                      {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="space-y-1.5 mb-4">
                    {order.order_items?.map(oi => (
                      <div key={oi.id} className="flex justify-between text-sm">
                        <span className="text-gray-700">{oi.menu_items?.name}</span>
                        <span className="font-bold text-gray-900">×{oi.quantity}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => markServed(order.id)}
                    className="w-full py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95"
                  >
                    <CheckCircle size={16} /> Mark as Served
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* All active orders overview */}
        <section>
          <h2 className="text-base font-black text-gray-800 mb-3 flex items-center gap-2">
            <Clock size={16} className="text-blue-500" />
            All Active Orders
          </h2>
          {activeOrders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 text-sm">No active orders</div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-3 text-xs font-black text-gray-500 uppercase tracking-wider">Table</th>
                    <th className="text-left px-4 py-3 text-xs font-black text-gray-500 uppercase tracking-wider">Items</th>
                    <th className="text-left px-4 py-3 text-xs font-black text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-black text-gray-500 uppercase tracking-wider">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {activeOrders.map(order => {
                    const sc: Record<string, string> = { ordered: 'text-blue-600 bg-blue-50', cooking: 'text-amber-600 bg-amber-50', ready_to_serve: 'text-green-600 bg-green-50' };
                    const sl: Record<string, string> = { ordered: 'Ordered', cooking: 'Cooking', ready_to_serve: 'Ready' };
                    return (
                      <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3 font-black text-gray-900">T{order.table_id}</td>
                        <td className="px-4 py-3 text-gray-600 max-w-xs truncate">
                          {order.order_items?.map(oi => `${oi.menu_items?.name} ×${oi.quantity}`).join(', ')}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${sc[order.status]}`}>{sl[order.status]}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
