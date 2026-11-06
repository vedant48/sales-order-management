import { useCallback, useEffect, useRef, useState } from 'react';
import { createOrder, getOrders, registerDevice, Order } from './api';
import { firebaseConfigured, onForegroundMessage, setupMessaging } from './firebase';

type LoadState = 'loading' | 'error' | 'ready';

export default function App() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [state, setState] = useState<LoadState>('loading');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [pushStatus, setPushStatus] = useState('Setting up notifications...');
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const loadOrders = useCallback(async () => {
    try {
      const data = await getOrders();
      setOrders(data);
      setState('ready');
      setError('');
    } catch (err) {
      setState('error');
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    if (!firebaseConfigured()) {
      setPushStatus('Push notifications unavailable (Firebase not configured or unsupported browser).');
      return;
    }
    let cancelled = false;
    setupMessaging()
      .then(async (token) => {
        if (cancelled) return;
        if (!token) {
          setPushStatus('Notification permission not granted - list will not auto-refresh.');
          return;
        }
        await registerDevice(token);
        setPushStatus('Live notifications enabled - the list refreshes automatically on new orders.');
        onForegroundMessage((payload) => {
          setNotice('New order received - refreshing list...');
          loadOrders().then(() => setTimeout(() => setNotice(''), 4000));
          // Also show a system notification while the page is open.
          const n = (payload as { notification?: { title?: string; body?: string } } | null)
            ?.notification;
          if (n?.title) {
            navigator.serviceWorker.ready
              .then((reg) => reg.showNotification(n.title as string, { body: n.body || '' }))
              .catch(() => {});
          }
        });
      })
      .catch((err) => setPushStatus(`Notification setup failed: ${err?.message || err}`));
    return () => {
      cancelled = true;
    };
  }, [loadOrders]);

  async function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setSubmitting(true);
    try {
      await createOrder({
        customerName: String(data.get('customerName') || ''),
        productName: String(data.get('productName') || ''),
        quantity: Number(data.get('quantity')),
        totalAmount: Number(data.get('totalAmount')),
      });
      form.reset();
      await loadOrders();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create order');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page">
      <header className="header">
        <div>
          <h1>Sales Orders</h1>
          <p className="subtitle">Real-time order list powered by Firebase Cloud Messaging</p>
        </div>
        <button className="refresh" onClick={loadOrders} disabled={state === 'loading'}>
          Refresh
        </button>
      </header>

      <p className="push-status">{pushStatus}</p>
      {notice && <p className="notice">{notice}</p>}

      <section className="card">
        <h2>Create order</h2>
        <form ref={formRef} onSubmit={onCreate} className="form">
          <input name="customerName" placeholder="Customer name" required maxLength={120} />
          <input name="productName" placeholder="Product name" required maxLength={160} />
          <input name="quantity" type="number" min={1} step={1} placeholder="Quantity" required />
          <input name="totalAmount" type="number" min={0} step="0.01" placeholder="Total amount" required />
          <button type="submit" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create order'}
          </button>
        </form>
      </section>

      <section className="card">
        <h2>Orders</h2>
        {state === 'loading' && <p className="state">Loading orders...</p>}
        {state === 'error' && (
          <div className="state error">
            <p>Could not load orders: {error}</p>
            <button onClick={loadOrders}>Retry</button>
          </div>
        )}
        {state === 'ready' && orders.length === 0 && (
          <p className="state">No orders yet. Create one above or via the API.</p>
        )}
        {state === 'ready' && orders.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td className="mono" title={o.id}>{o.id.slice(0, 8)}...</td>
                    <td>{o.customerName}</td>
                    <td>{o.productName}</td>
                    <td>{o.quantity}</td>
                    <td>{Number(o.totalAmount).toFixed(2)}</td>
                    <td><span className={`status status-${o.status.toLowerCase()}`}>{o.status}</span></td>
                    <td>{new Date(o.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
