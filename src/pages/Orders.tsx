import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Clock,
  ChefHat,
  CheckCircle,
  Package,
  Search,
  Eye,
  Trash2,
  RefreshCw,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { getOrders, getOrderItems, updateOrderStatus, deleteOrder } from '../lib/database';
import { showToast } from '../components/ui/Toast';
import { Modal } from '../components/ui/Modal';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Order, OrderItem } from '../types';

const statusConfig = {
  pending: { label: 'In Attesa', icon: Clock, color: 'badge-warning', next: 'preparing' },
  preparing: { label: 'In Preparazione', icon: ChefHat, color: 'badge-info', next: 'ready' },
  ready: { label: 'Pronto', icon: CheckCircle, color: 'badge-success', next: 'delivered' },
  delivered: { label: 'Consegnato', icon: Package, color: 'badge-success', next: null },
  cancelled: { label: 'Annullato', icon: Trash2, color: 'badge-danger', next: null },
};

const orderTypeLabels = {
  dine_in: 'Tavolo',
  takeaway: 'Asporto',
  delivery: 'Domicilio',
};

export function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

  const loadOrdersCallback = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getOrders(selectedDate);
      setOrders(data);
    } catch (error) {
      console.error('Error loading orders:', error);
      showToast('Errore nel caricamento ordini', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadOrdersCallback();
  }, [loadOrdersCallback]);

  // Supabase Realtime subscription
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    const channel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          console.log('Realtime update:', payload);
          // Reload orders when any change occurs
          loadOrdersCallback();
        }
      )
      .subscribe((status) => {
        console.log('Realtime status:', status);
        setIsRealtimeConnected(status === 'SUBSCRIBED');
      });

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [loadOrdersCallback]);

  async function handleStatusChange(order: Order) {
    const config = statusConfig[order.status];
    if (!config.next) return;

    try {
      await updateOrderStatus(order.id, config.next as Order['status']);
      showToast(`Ordine #${order.id} aggiornato`, 'success');
      loadOrdersCallback();
    } catch (error) {
      console.error('Error updating order:', error);
      showToast('Errore nell\'aggiornamento', 'error');
    }
  }

  async function handleDelete(orderId: number) {
    if (!confirm('Sei sicuro di voler eliminare questo ordine?')) return;

    try {
      await deleteOrder(orderId);
      showToast('Ordine eliminato', 'success');
      loadOrdersCallback();
    } catch (error) {
      console.error('Error deleting order:', error);
      showToast('Errore nell\'eliminazione', 'error');
    }
  }

  async function viewOrderDetails(order: Order) {
    setSelectedOrder(order);
    try {
      const items = await getOrderItems(order.id);
      setOrderItems(items);
      setShowDetails(true);
    } catch (error) {
      console.error('Error loading order items:', error);
      showToast('Errore nel caricamento dettagli', 'error');
    }
  }

  const filteredOrders = orders.filter((order) => {
    if (statusFilter !== 'all' && order.status !== statusFilter) return false;
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      return (
        order.id.toString().includes(search) ||
        order.customer_name?.toLowerCase().includes(search) ||
        order.table_name?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const ordersByStatus = {
    pending: filteredOrders.filter((o) => o.status === 'pending'),
    preparing: filteredOrders.filter((o) => o.status === 'preparing'),
    ready: filteredOrders.filter((o) => o.status === 'ready'),
    delivered: filteredOrders.filter((o) => o.status === 'delivered'),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Ordini</h1>
          <p className="text-dark-400 mt-1">Gestisci gli ordini del ristorante</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Realtime connection status */}
          {isSupabaseConfigured && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${
              isRealtimeConnected
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-amber-500/20 text-amber-400'
            }`}>
              {isRealtimeConnected ? (
                <>
                  <Wifi className="w-4 h-4" />
                  <span className="hidden sm:inline">Live</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4" />
                  <span className="hidden sm:inline">Offline</span>
                </>
              )}
            </div>
          )}
          <button onClick={loadOrdersCallback} className="btn-secondary">
            <RefreshCw className="w-5 h-5" />
          </button>
          <Link to="/orders/new" className="btn-primary">
            <Plus className="w-5 h-5" />
            Nuovo Ordine
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
          <input
            type="text"
            placeholder="Cerca ordine..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10"
          />
        </div>

        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="input w-auto"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="select w-auto"
        >
          <option value="all">Tutti gli stati</option>
          <option value="pending">In Attesa</option>
          <option value="preparing">In Preparazione</option>
          <option value="ready">Pronto</option>
          <option value="delivered">Consegnato</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        /* Kanban View */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {(['pending', 'preparing', 'ready', 'delivered'] as const).map((status) => {
            const config = statusConfig[status];
            const statusOrders = ordersByStatus[status];

            return (
              <div key={status} className="card">
                <div className="card-header flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <config.icon className="w-5 h-5" />
                    <span className="font-semibold">{config.label}</span>
                  </div>
                  <span className={config.color}>{statusOrders.length}</span>
                </div>
                <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
                  {statusOrders.length === 0 ? (
                    <p className="text-dark-500 text-center py-4 text-sm">
                      Nessun ordine
                    </p>
                  ) : (
                    statusOrders.map((order) => (
                      <div
                        key={order.id}
                        className="bg-dark-900 rounded-xl p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-white">
                              Ordine #{order.id}
                            </p>
                            <p className="text-sm text-dark-400">
                              {orderTypeLabels[order.order_type]}
                              {order.table_name && ` - ${order.table_name}`}
                            </p>
                            {order.customer_name && (
                              <p className="text-sm text-dark-400">
                                {order.customer_name}
                              </p>
                            )}
                          </div>
                          <p className="font-bold text-primary-400">
                            €{order.total.toFixed(2)}
                          </p>
                        </div>

                        {order.notes && (
                          <p className="text-sm text-dark-400 bg-dark-800 p-2 rounded-lg">
                            {order.notes}
                          </p>
                        )}

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => viewOrderDetails(order)}
                            className="btn-ghost btn-sm flex-1"
                          >
                            <Eye className="w-4 h-4" />
                            Dettagli
                          </button>
                          {config.next && (
                            <button
                              onClick={() => handleStatusChange(order)}
                              className="btn-success btn-sm flex-1"
                            >
                              <CheckCircle className="w-4 h-4" />
                              {status === 'pending'
                                ? 'Prepara'
                                : status === 'preparing'
                                ? 'Pronto'
                                : 'Consegna'}
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Order Details Modal */}
      <Modal
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        title={`Ordine #${selectedOrder?.id}`}
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-4">
            {/* Order Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-dark-400">Tipo</p>
                <p className="font-medium text-white">
                  {orderTypeLabels[selectedOrder.order_type]}
                </p>
              </div>
              <div>
                <p className="text-sm text-dark-400">Stato</p>
                <span className={statusConfig[selectedOrder.status].color}>
                  {statusConfig[selectedOrder.status].label}
                </span>
              </div>
              {selectedOrder.table_name && (
                <div>
                  <p className="text-sm text-dark-400">Tavolo</p>
                  <p className="font-medium text-white">{selectedOrder.table_name}</p>
                </div>
              )}
              {selectedOrder.customer_name && (
                <div>
                  <p className="text-sm text-dark-400">Cliente</p>
                  <p className="font-medium text-white">{selectedOrder.customer_name}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-dark-400">Pagamento</p>
                <p className="font-medium text-white capitalize">
                  {selectedOrder.payment_method === 'cash'
                    ? 'Contanti'
                    : selectedOrder.payment_method === 'card'
                    ? 'Carta'
                    : 'Online'}
                </p>
              </div>
              <div>
                <p className="text-sm text-dark-400">SMAC</p>
                <p className="font-medium text-white">
                  {selectedOrder.smac_passed ? 'Sì' : 'No'}
                </p>
              </div>
            </div>

            {/* Items */}
            <div>
              <p className="text-sm text-dark-400 mb-2">Prodotti</p>
              <div className="space-y-2">
                {orderItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-dark-900 rounded-xl"
                  >
                    <div>
                      <p className="font-medium text-white">
                        {item.quantity}x {item.menu_item_name}
                      </p>
                      {item.notes && (
                        <p className="text-sm text-dark-400">{item.notes}</p>
                      )}
                    </div>
                    <p className="font-medium text-primary-400">
                      €{(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            {selectedOrder.notes && (
              <div>
                <p className="text-sm text-dark-400 mb-2">Note</p>
                <p className="p-3 bg-dark-900 rounded-xl text-white">
                  {selectedOrder.notes}
                </p>
              </div>
            )}

            {/* Total */}
            <div className="flex items-center justify-between pt-4 border-t border-dark-700">
              <span className="text-lg font-semibold text-white">Totale</span>
              <span className="text-2xl font-bold text-primary-400">
                €{selectedOrder.total.toFixed(2)}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4">
              {statusConfig[selectedOrder.status].next && (
                <button
                  onClick={() => {
                    handleStatusChange(selectedOrder);
                    setShowDetails(false);
                  }}
                  className="btn-success flex-1"
                >
                  <CheckCircle className="w-5 h-5" />
                  Avanza Stato
                </button>
              )}
              <button
                onClick={() => {
                  handleDelete(selectedOrder.id);
                  setShowDetails(false);
                }}
                className="btn-danger"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
