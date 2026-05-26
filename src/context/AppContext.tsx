import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type {
  MenuItem, Order, WaiterCall, CartItem, Role,
  NewMenuItem, Waiter, RoleCredential, AuthState, SessionSnapshot,
} from '../lib/database.types';

interface AppContextValue {
  // Auth
  auth: AuthState | null;
  loginChef: (password: string) => Promise<boolean>;
  loginManager: (password: string) => Promise<boolean>;
  loginCaptain: (password: string) => Promise<boolean>;
  logout: () => void;

  // Customer table (no login)
  activeTableId: number;
  setActiveTableId: (id: number) => void;

  // Data
  menuItems: MenuItem[];
  orders: Order[];
  waiterCalls: WaiterCall[];
  waiters: Waiter[];
  roleCredentials: RoleCredential[];

  // Cart
  cart: CartItem[];
  addToCart: (item: MenuItem) => void;
  removeFromCart: (itemId: string) => void;
  updateCartQty: (itemId: string, delta: number) => void;
  clearCart: () => void;

  // Order actions
  placeOrder: () => Promise<void>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  markServed: (orderId: string) => Promise<void>;

  // Menu actions
  toggleMenuAvailability: (itemId: string, current: boolean) => Promise<void>;
  addMenuItem: (item: NewMenuItem) => Promise<void>;
  updateMenuItem: (itemId: string, item: NewMenuItem) => Promise<void>;
  deleteMenuItem: (itemId: string) => Promise<void>;

  // Captain call actions
  callWaiter: (tableId: number) => Promise<void>;
  acknowledgeWaiterCall: (callId: string) => Promise<void>;
  resolveWaiterCall: (callId: string) => Promise<void>;

  updateRolePassword: (role: string, password: string) => Promise<void>;

  resetSession: () => Promise<void>;
  snapshots: SessionSnapshot[];

  cartOpen: boolean;
  setCartOpen: (v: boolean) => void;
  placingOrder: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

const SESSION_KEY = 'freshbite_auth';

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState | null>(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [activeTableId, setActiveTableId] = useState<number>(1);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [waiterCalls, setWaiterCalls] = useState<WaiterCall[]>([]);
  const [waiters, setWaiters] = useState<Waiter[]>([]);
  const [roleCredentials, setRoleCredentials] = useState<RoleCredential[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [snapshots, setSnapshots] = useState<SessionSnapshot[]>([]);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAll = useCallback(async () => {
    const [menuRes, ordersRes, callsRes, waitersRes, credsRes, snapshotsRes] = await Promise.all([
      supabase.from('menu_items').select('*').order('category').order('name'),
      supabase
        .from('orders')
        .select('*, order_items(*, menu_items(*)), waiters(id, name)')
        .order('created_at', { ascending: false })
        .limit(200),
      supabase
        .from('waiter_calls')
        .select('*, waiters(id, name)')
        .order('created_at', { ascending: false })
        .limit(500),
      supabase.from('waiters').select('*').eq('is_active', true).order('name'),
      supabase.from('role_credentials').select('*'),
      supabase.from('session_snapshots').select('*').order('session_index', { ascending: false }),
    ]);
    if (menuRes.data) setMenuItems(menuRes.data as MenuItem[]);
    if (ordersRes.data) setOrders(ordersRes.data as Order[]);
    if (callsRes.data) setWaiterCalls(callsRes.data as WaiterCall[]);
    if (waitersRes.data) setWaiters(waitersRes.data as Waiter[]);
    if (credsRes.data) setRoleCredentials(credsRes.data as RoleCredential[]);
    if (snapshotsRes.data) setSnapshots(snapshotsRes.data as SessionSnapshot[]);
  }, []);

  useEffect(() => {
    fetchAll();

    const channels = [
      supabase.channel('rt_menu').on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, () => fetchAll()).subscribe(),
      supabase.channel('rt_orders').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchAll()).subscribe(),
      supabase.channel('rt_order_items').on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, () => fetchAll()).subscribe(),
      supabase.channel('rt_calls').on('postgres_changes', { event: '*', schema: 'public', table: 'waiter_calls' }, () => fetchAll()).subscribe(),
      supabase.channel('rt_waiters').on('postgres_changes', { event: '*', schema: 'public', table: 'waiters' }, () => fetchAll()).subscribe(),
    ];

    pollRef.current = setInterval(fetchAll, 5000);

    return () => {
      channels.forEach(c => supabase.removeChannel(c));
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchAll]);

  // URL-based table pre-selection for customers
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = parseInt(params.get('table') ?? '', 10);
    if (t >= 1 && t <= 10) setActiveTableId(t);
  }, []);

  function persistAuth(a: AuthState | null) {
    if (a) sessionStorage.setItem(SESSION_KEY, JSON.stringify(a));
    else sessionStorage.removeItem(SESSION_KEY);
    setAuth(a);
  }

  const loginChef = useCallback(async (password: string): Promise<boolean> => {
    const { data } = await supabase.from('role_credentials').select('password').eq('role', 'chef').maybeSingle();
    if (data?.password === password) { persistAuth({ role: 'chef' }); return true; }
    return false;
  }, []);

  const loginManager = useCallback(async (password: string): Promise<boolean> => {
    const { data } = await supabase.from('role_credentials').select('password').eq('role', 'manager').maybeSingle();
    if (data?.password === password) { persistAuth({ role: 'manager' }); return true; }
    return false;
  }, []);

  const loginCaptain = useCallback(async (password: string): Promise<boolean> => {
    const { data: cred } = await supabase.from('role_credentials').select('password').eq('role', 'waiter').maybeSingle();
    if (cred?.password !== password) return false;
    const { data: captain } = await supabase.from('waiters').select('*').eq('is_active', true).maybeSingle();
    if (captain) { persistAuth({ role: 'waiter', waiter: captain as Waiter }); return true; }
    persistAuth({ role: 'waiter' });
    return true;
  }, []);

  const logout = useCallback(() => persistAuth(null), []);

  const addToCart = useCallback((item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.menu_item.id === item.id);
      if (existing) return prev.map(c => c.menu_item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { menu_item: item, quantity: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((itemId: string) => setCart(prev => prev.filter(c => c.menu_item.id !== itemId)), []);

  const updateCartQty = useCallback((itemId: string, delta: number) => {
    setCart(prev => prev.map(c => c.menu_item.id === itemId ? { ...c, quantity: c.quantity + delta } : c).filter(c => c.quantity > 0));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const placeOrder = useCallback(async () => {
    if (cart.length === 0) return;
    setPlacingOrder(true);
    try {
      const { data: order, error } = await supabase
        .from('orders')
        .insert({ table_id: activeTableId, status: 'ordered', served_by_waiter_id: null })
        .select()
        .single();
      if (error || !order) throw error;
      await supabase.from('order_items').insert(cart.map(c => ({
        order_id: order.id,
        menu_item_id: c.menu_item.id,
        quantity: c.quantity,
      })));
      clearCart();
      setCartOpen(false);
      await fetchAll();
    } finally {
      setPlacingOrder(false);
    }
  }, [cart, activeTableId, clearCart, fetchAll]);

  const updateOrderStatus = useCallback(async (orderId: string, status: Order['status']) => {
    await supabase.from('orders').update({ status }).eq('id', orderId);
    await fetchAll();
  }, [fetchAll]);

  const markServed = useCallback(async (orderId: string) => {
    const waiterId = auth?.role === 'waiter' ? (auth.waiter?.id ?? null) : null;
    await supabase.from('orders').update({ status: 'served', served_by_waiter_id: waiterId ?? null }).eq('id', orderId);
    await fetchAll();
  }, [auth, fetchAll]);

  const toggleMenuAvailability = useCallback(async (itemId: string, current: boolean) => {
    await supabase.from('menu_items').update({ is_available: !current }).eq('id', itemId);
    await fetchAll();
  }, [fetchAll]);

  const addMenuItem = useCallback(async (item: NewMenuItem) => {
    await supabase.from('menu_items').insert(item);
    await fetchAll();
  }, [fetchAll]);

  const updateMenuItem = useCallback(async (itemId: string, item: NewMenuItem) => {
    await supabase.from('menu_items').update(item).eq('id', itemId);
    await fetchAll();
  }, [fetchAll]);

  const deleteMenuItem = useCallback(async (itemId: string) => {
    await supabase.from('menu_items').delete().eq('id', itemId);
    await fetchAll();
  }, [fetchAll]);

  const callWaiter = useCallback(async (tableId: number) => {
    await supabase.from('waiter_calls').insert({ table_id: tableId, is_resolved: false, is_acknowledged: false });
    await fetchAll();
  }, [fetchAll]);

  const acknowledgeWaiterCall = useCallback(async (callId: string) => {
    const waiterId = auth?.role === 'waiter' ? (auth.waiter?.id ?? null) : null;
    await supabase.from('waiter_calls').update({
      is_acknowledged: true,
      attended_by_waiter_id: waiterId ?? null,
    }).eq('id', callId);
    await fetchAll();
  }, [auth, fetchAll]);

  const resolveWaiterCall = useCallback(async (callId: string) => {
    await supabase.from('waiter_calls').update({ is_resolved: true }).eq('id', callId);
    await fetchAll();
  }, [fetchAll]);

  const updateRolePassword = useCallback(async (role: string, password: string) => {
    await supabase.from('role_credentials').update({ password }).eq('role', role);
    await fetchAll();
  }, [fetchAll]);

  const resetSession = useCallback(async () => {
    // Fetch all current orders with full detail for snapshot
    const { data: allOrders } = await supabase
      .from('orders')
      .select('*, order_items(*, menu_items(*)), waiters(id, name)')
      .order('created_at', { ascending: false });
    const { data: allCalls } = await supabase.from('waiter_calls').select('*, waiters(id, name)');
    const { data: allWaiters } = await supabase.from('waiters').select('*').eq('is_active', true);
    const { data: existing } = await supabase.from('session_snapshots').select('session_index').order('session_index', { ascending: false }).limit(1).maybeSingle();

    const sessionOrders: Order[] = (allOrders as Order[]) ?? [];
    const sessionCalls = allCalls ?? [];
    const sessionWaiters: Waiter[] = (allWaiters as Waiter[]) ?? [];
    const nextIndex = (existing?.session_index ?? 0) + 1;

    const waiter_summary = sessionWaiters.map(w => ({
      name: w.name,
      orders_served: sessionOrders.filter(o => o.status === 'served' && o.served_by_waiter_id === w.id).length,
      calls_attended: sessionCalls.filter(c => c.attended_by_waiter_id === w.id).length,
    }));

    const table_summary = Array.from({ length: 10 }, (_, i) => {
      const t = i + 1;
      const tOrders = sessionOrders.filter(o => o.table_id === t);
      return {
        table_id: t,
        order_count: tOrders.length,
        items_count: tOrders.reduce((sum, o) => sum + (o.order_items?.reduce((s, oi) => s + oi.quantity, 0) ?? 0), 0),
      };
    }).filter(t => t.order_count > 0);

    const snapshot = {
      session_index: nextIndex,
      snapshot_date: new Date().toISOString(),
      total_orders: sessionOrders.length,
      orders_served: sessionOrders.filter(o => o.status === 'served').length,
      orders_cancelled: sessionOrders.filter(o => o.status === 'cancelled').length,
      orders_cooking: sessionOrders.filter(o => o.status === 'cooking').length,
      orders_pending: sessionOrders.filter(o => o.status === 'ordered').length,
      waiter_summary,
      table_summary,
      orders_snapshot: sessionOrders,
    };

    await supabase.from('session_snapshots').insert(snapshot);

    // Delete all records using a past-timestamp filter that matches everything
    const epoch = '2000-01-01T00:00:00.000Z';
    await supabase.from('order_items').delete().gte('created_at', epoch);
    await supabase.from('orders').delete().gte('created_at', epoch);
    await supabase.from('waiter_calls').delete().gte('created_at', epoch);

    await fetchAll();
  }, [fetchAll]);

  return (
    <AppContext.Provider value={{
      auth, loginChef, loginManager, loginCaptain, logout,
      activeTableId, setActiveTableId,
      menuItems, orders, waiterCalls, waiters, roleCredentials,
      cart, addToCart, removeFromCart, updateCartQty, clearCart,
      placeOrder, updateOrderStatus, markServed,
      toggleMenuAvailability, addMenuItem, updateMenuItem, deleteMenuItem,
      callWaiter, acknowledgeWaiterCall, resolveWaiterCall,
      updateRolePassword,
      resetSession, snapshots,
      cartOpen, setCartOpen, placingOrder,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
