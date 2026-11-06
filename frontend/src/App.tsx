import { useCallback, useEffect, useRef, useState } from 'react';
import { createOrder, getOrders, registerDevice, Order } from './api';
import { firebaseConfigured, onForegroundMessage, setupMessaging } from './firebase';

type LoadState = 'loading' | 'error' | 'ready';
type PushState = 'loading' | 'enabled' | 'prompt' | 'denied' | 'unavailable' | 'error';

const PUSH_TEXT: Record<PushState, string> = {
  loading: 'Setting up notifications...',
  enabled: 'Live notifications enabled - the list refreshes automatically on new orders.',
  prompt: 'Notifications are off - enable them to get new-order alerts and auto-refresh.',
  denied:
    'Notifications are blocked by the browser. Allow them in the browser site settings, then tap Retry.',
  unavailable: 'Push notifications unavailable (Firebase not configured or unsupported browser).',
  error: 'Notification setup failed - tap Retry to try again.',
};

export default function App() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [state, setState] = useState<LoadState>('loading');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [pushState, setPushState] = useState<PushState>('loading');
  const [submitting, setSubmitting] = useState(false);
  const pushListenerAdded = useRef(false);

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

  const enableNotifications = useCallback(async () => {
    if (!firebaseConfigured()) {
      setPushState('unavailable');
      return;
    }
    if (Notification.permission === 'denied') {
      // Browsers do not allow re-prompting after a block; the user must
      // re-enable permission in the browser's site settings.
      setPushState('denied');
      return;
    }
    setPushState('loading');
    try {
      const token = await setupMessaging();
      if (!token) {
        const perm = Notification.permission as NotificationPermission;
        setPushState(perm === 'denied' ? 'denied' : 'prompt');
        return;
      }
      await registerDevice(token);
      setPushState('enabled');
      if (!pushListenerAdded.current) {
        pushListenerAdded.current = true;
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
      }
    } catch (err) {
      console.error('Notification setup failed:', err);
      setPushState('error');
    }
  }, [loadOrders]);

  useEffect(() => {
    enableNotifications();
  }, [enableNotifications]);

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

      <div className="push-row">
        <p className="push-status">{PUSH_TEXT[pushState]}</p>
        {(pushState === 'prompt' || pushState === 'error' || pushState === 'denied') && (
          <button className="enable-push" onClick={enableNotifications}>
            {pushState === 'prompt' ? 'Enable notifications' : 'Retry'}
          </button>
        )}
      </div>
      {notice && <p className="notice">{notice}</p>}

      <section className="card">
        <h2>Create order</h2>
        <form onSubmit={onCreate} className="form">
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
