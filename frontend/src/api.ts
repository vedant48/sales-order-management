const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export interface Order {
  id: string;
  customerName: string;
  productName: string;
  quantity: number;
  totalAmount: string;
  status: string;
  createdAt: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export const getOrders = () => request<Order[]>('/orders');

export const createOrder = (payload: {
  customerName: string;
  productName: string;
  quantity: number;
  totalAmount: number;
}) => request<Order>('/orders', { method: 'POST', body: JSON.stringify(payload) });

export const registerDevice = (token: string) =>
  request<{ registered: boolean }>('/devices/register', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
