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
  Edit2,
} from 'lucide-react';
import { getOrders, getOrderItems, updateOrderStatus, deleteOrder, updateOrder, getTables } from '../lib/database';
import { showToast } from '../components/ui/Toast';
import { Modal } from '../components/ui/Modal';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Order, OrderItem, Table } from '../types';

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

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [tables, setTables] = useState<Table[]>([]);
  const [editForm, setEditForm] = useState({
    order_type: 'dine_in' as Order['order_type'],
    table_id: undefined as number | undefined,
    payment_method: 'cash' as Order['payment_method'],
    customer_name: '',
    customer_phone: '',
    notes: '',
    smac_passed: false,
    status: 'pending' as Order['status'],
  });

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

  async function openEditModal(order: Order) {
    setSelectedOrder(order);
    setEditForm({
      order_type: order.order_type,
      table_id: order.table_id,
      payment_method: order.payment_method,
      customer_name: order.customer_name || '',
      customer_phone: order.customer_phone || '',
      notes: order.notes || '',
      smac_passed: order.smac_passed,
      status: order.status,
    });

    // Carica tavoli se non già caricati
    if (tables.length === 0) {
      try {
        const tablesData = await getTables();
        setTables(tablesData);
      } catch (error) {
        console.error('Error loading tables:', error);
      }
    }

    setShowEditModal(true);
  }

  async function handleSaveEdit() {
    if (!selectedOrder) return;

    try {
      await updateOrder(selectedOrder.id, {
        order_type: editForm.order_type,
        table_id: editForm.order_type === 'dine_in' ? editForm.table_id : undefined,
        payment_method: editForm.payment_method,
        customer_name: editForm.customer_name || undefined,
        customer_phone: editForm.customer_phone || undefined,
        notes: editForm.notes || undefined,
        smac_passed: editForm.smac_passed,
        status: editForm.status,
      });

      showToast('Ordine modificato con successo', 'success');
      setShowEditModal(false);
      loadOrdersCallback();
    } catch (error) {
      console.error('Error updating order:', error);
      showToast('Errore nella modifica', 'error');
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
                          <button
                            onClick={() => openEditModal(order)}
                            className="btn-secondary btn-sm"
                            title="Modifica ordine"
                          >
                            <Edit2 className="w-4 h-4" />
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
              <button
                onClick={() => {
                  setShowDetails(false);
                  openEditModal(selectedOrder);
                }}
                className="btn-secondary flex-1"
              >
                <Edit2 className="w-5 h-5" />
                Modifica
              </button>
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

      {/* Edit Order Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={`Modifica Ordine #${selectedOrder?.id}`}
        size="lg"
      >
        <div className="space-y-4">
          {/* Tipo ordine */}
          <div>
            <label className="label">Tipo Ordine</label>
            <div className="grid grid-cols-3 gap-2">
              {(['dine_in', 'takeaway', 'delivery'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setEditForm({ ...editForm, order_type: type })}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    editForm.order_type === type
                      ? 'border-primary-500 bg-primary-500/20 text-primary-400'
                      : 'border-dark-600 hover:border-dark-500 text-dark-300'
                  }`}
                >
                  {orderTypeLabels[type]}
                </button>
              ))}
            </div>
          </div>

          {/* Tavolo (solo se dine_in) */}
          {editForm.order_type === 'dine_in' && (
            <div>
              <label className="label">Tavolo</label>
              <select
                value={editForm.table_id || ''}
                onChange={(e) => setEditForm({ ...editForm, table_id: e.target.value ? Number(e.target.value) : undefined })}
                className="select"
              >
                <option value="">Seleziona tavolo</option>
                {tables.map((table) => (
                  <option key={table.id} value={table.id}>
                    {table.name} ({table.capacity} posti)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Cliente */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Nome Cliente</label>
              <input
                type="text"
                value={editForm.customer_name}
                onChange={(e) => setEditForm({ ...editForm, customer_name: e.target.value })}
                className="input"
                placeholder="Nome cliente"
              />
            </div>
            <div>
              <label className="label">Telefono</label>
              <input
                type="tel"
                value={editForm.customer_phone}
                onChange={(e) => setEditForm({ ...editForm, customer_phone: e.target.value })}
                className="input"
                placeholder="Telefono"
              />
            </div>
          </div>

          {/* Metodo pagamento */}
          <div>
            <label className="label">Metodo Pagamento</label>
            <div className="grid grid-cols-3 gap-2">
              {(['cash', 'card', 'online'] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setEditForm({ ...editForm, payment_method: method })}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    editForm.payment_method === method
                      ? 'border-primary-500 bg-primary-500/20 text-primary-400'
                      : 'border-dark-600 hover:border-dark-500 text-dark-300'
                  }`}
                >
                  {method === 'cash' ? 'Contanti' : method === 'card' ? 'Carta' : 'Online'}
                </button>
              ))}
            </div>
          </div>

          {/* Stato */}
          <div>
            <label className="label">Stato Ordine</label>
            <select
              value={editForm.status}
              onChange={(e) => setEditForm({ ...editForm, status: e.target.value as Order['status'] })}
              className="select"
            >
              <option value="pending">In Attesa</option>
              <option value="preparing">In Preparazione</option>
              <option value="ready">Pronto</option>
              <option value="delivered">Consegnato</option>
              <option value="cancelled">Annullato</option>
            </select>
          </div>

          {/* SMAC */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="smac_edit"
              checked={editForm.smac_passed}
              onChange={(e) => setEditForm({ ...editForm, smac_passed: e.target.checked })}
              className="w-5 h-5 rounded border-dark-600 text-primary-500 focus:ring-primary-500"
            />
            <label htmlFor="smac_edit" className="text-white cursor-pointer">
              SMAC Passata
            </label>
          </div>

          {/* Note */}
          <div>
            <label className="label">Note</label>
            <textarea
              value={editForm.notes}
              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              className="input min-h-[80px]"
              placeholder="Note aggiuntive..."
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <button onClick={handleSaveEdit} className="btn-primary flex-1">
              Salva Modifiche
            </button>
            <button onClick={() => setShowEditModal(false)} className="btn-secondary">
              Annulla
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
