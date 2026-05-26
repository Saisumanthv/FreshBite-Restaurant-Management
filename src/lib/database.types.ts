export type OrderStatus = 'ordered' | 'cooking' | 'ready_to_serve' | 'served' | 'cancelled';

export interface MenuItem {
  id: string;
  name: string;
  ingredients: string[];
  image_url: string;
  category: string;
  is_available: boolean;
  created_at: string;
}

export interface Table {
  id: number;
  qr_code_payload: string;
}

export interface WaiterCall {
  id: string;
  table_id: number;
  is_resolved: boolean;
  is_acknowledged: boolean;
  attended_by_waiter_id: string | null;
  created_at: string;
  waiters?: Waiter;
}

export interface Order {
  id: string;
  table_id: number;
  status: OrderStatus;
  created_at: string;
  served_by_waiter_id: string | null;
  order_items?: OrderItem[];
  waiters?: Waiter;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  created_at: string;
  menu_items?: MenuItem;
}

export interface CartItem {
  menu_item: MenuItem;
  quantity: number;
}

export interface Waiter {
  id: string;
  name: string;
  password: string;
  is_active: boolean;
  created_at: string;
}

export interface RoleCredential {
  role: string;
  password: string;
}

export type Role = 'customer' | 'chef' | 'waiter' | 'manager';

export interface AuthState {
  role: Role;
  waiter?: Waiter;
}

export interface SessionSnapshot {
  id: string;
  session_index: number;
  snapshot_date: string;
  total_orders: number;
  orders_served: number;
  orders_cancelled: number;
  orders_cooking: number;
  orders_pending: number;
  waiter_summary: { name: string; orders_served: number; calls_attended: number }[];
  table_summary: { table_id: number; order_count: number; items_count: number }[];
  orders_snapshot: Order[];
  created_at: string;
}

export interface NewMenuItem {
  name: string;
  ingredients: string[];
  image_url: string;
  category: string;
  is_available: boolean;
}

export interface Database {
  public: {
    Tables: {
      menu_items: { Row: MenuItem; Insert: Omit<MenuItem, 'id' | 'created_at'>; Update: Partial<MenuItem> };
      tables: { Row: Table; Insert: Table; Update: Partial<Table> };
      waiter_calls: { Row: WaiterCall; Insert: Omit<WaiterCall, 'id' | 'created_at' | 'waiters'>; Update: Partial<WaiterCall> };
      orders: { Row: Order; Insert: Omit<Order, 'id' | 'created_at' | 'order_items' | 'waiters'>; Update: Partial<Order> };
      order_items: { Row: OrderItem; Insert: Omit<OrderItem, 'id' | 'created_at' | 'menu_items'>; Update: Partial<OrderItem> };
      waiters: { Row: Waiter; Insert: Omit<Waiter, 'id' | 'created_at'>; Update: Partial<Waiter> };
      role_credentials: { Row: RoleCredential; Insert: RoleCredential; Update: Partial<RoleCredential> };
    };
  };
}
