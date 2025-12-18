import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ShoppingCart, ChevronUp, X, Users, Clock, AlertCircle } from 'lucide-react';
import {
  getCategories,
  getMenuItems,
  getTables,
  createOrder,
  getSettings,
  getTableSession,
  getNextOrderNumber,
  updateSessionTotal,
  getActiveSessionForTable,
  getSessionOrders,
} from '../lib/database';
import { showToast } from '../components/ui/Toast';
import { CartContent } from '../components/order/CartContent';
import { Modal } from '../components/ui/Modal';
import type { Category, MenuItem, Table, CartItem, Settings, TableSession, Order } from '../types';

type OrderType = 'dine_in' | 'takeaway' | 'delivery';
type PaymentMethod = 'cash' | 'card' | 'online';

export function NewOrder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  // Session state (conto aperto)
  const [activeSession, setActiveSession] = useState<TableSession | null>(null);
  const [nextOrderNumber, setNextOrderNumber] = useState<number>(1);

  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<OrderType>('dine_in');
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [smacPassed, setSmacPassed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedItemId, setExpandedItemId] = useState<number | null>(null);

  // Mobile cart panel state
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  // Modal per conto aperto rilevato
  const [showSessionDetectedModal, setShowSessionDetectedModal] = useState(false);
  const [detectedSession, setDetectedSession] = useState<TableSession | null>(null);
  const [detectedSessionOrders, setDetectedSessionOrders] = useState<Order[]>([]);
  const [pendingTableId, setPendingTableId] = useState<number | null>(null);

  // Leggi parametri URL per sessione
  const sessionIdParam = searchParams.get('session');
  const tableIdParam = searchParams.get('table');

  useEffect(() => {
    loadData();
  }, [sessionIdParam, tableIdParam]);

  async function loadData() {
    try {
      const [cats, items, tbls, setts] = await Promise.all([
        getCategories(),
        getMenuItems(),
        getTables(),
        getSettings(),
      ]);
      setCategories(cats);
      setMenuItems(items);
      setTables(tbls);
      setSettings(setts);
      if (cats.length > 0) {
        setSelectedCategory(cats[0].id);
      }

      // Se c'è una sessione, caricala
      if (sessionIdParam) {
        const sessionId = parseInt(sessionIdParam);
        const session = await getTableSession(sessionId);
        if (session) {
          setActiveSession(session);
          setSelectedTable(session.table_id);
          setOrderType('dine_in');
          const orderNum = await getNextOrderNumber(sessionId);
          setNextOrderNumber(orderNum);
          // Precompila cliente se presente nella sessione
          if (session.customer_name) setCustomerName(session.customer_name);
          if (session.customer_phone) setCustomerPhone(session.customer_phone);
        }
      } else if (tableIdParam) {
        // Solo tavolo senza sessione
        setSelectedTable(parseInt(tableIdParam));
        setOrderType('dine_in');
      }
    } catch (error) {
      console.error('Error loading data:', error);
      showToast('Errore nel caricamento dati', 'error');
    } finally {
      setLoading(false);
    }
  }

  const filteredItems = selectedCategory
    ? menuItems.filter((item) => item.category_id === selectedCategory && item.available)
    : menuItems.filter((item) => item.available);

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const ivaRate = settings?.iva_rate || 17;
  const ivaAmount = cartTotal * (ivaRate / 100);
  const grandTotal = cartTotal + ivaAmount;

  function addToCart(item: MenuItem) {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    // Feedback visivo
    showToast(`${item.name} aggiunto`, 'success');
  }

  function updateQuantity(itemId: number, delta: number) {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === itemId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function removeFromCart(itemId: number) {
    setCart((prev) => prev.filter((item) => item.id !== itemId));
  }

  function updateItemNotes(itemId: number, itemNotes: string) {
    setCart((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, notes: itemNotes } : item
      )
    );
  }

  function clearCart() {
    setCart([]);
    setExpandedItemId(null);
  }

  // Gestisce la selezione del tavolo con rilevamento conto aperto
  async function handleTableSelect(tableId: number) {
    // Se siamo già in una sessione (da URL), non fare nulla
    if (activeSession) return;

    // Controlla se il tavolo ha un conto aperto
    const existingSession = await getActiveSessionForTable(tableId);

    if (existingSession) {
      // Carica gli ordini della sessione per mostrare i dettagli
      const orders = await getSessionOrders(existingSession.id);
      setDetectedSession(existingSession);
      setDetectedSessionOrders(orders);
      setPendingTableId(tableId);
      setShowSessionDetectedModal(true);
    } else {
      // Nessuna sessione, seleziona normalmente il tavolo
      setSelectedTable(tableId);
      setActiveSession(null);
    }
  }

  // Conferma aggiunta al conto esistente
  async function confirmAddToSession() {
    if (!detectedSession || !pendingTableId) return;

    setActiveSession(detectedSession);
    setSelectedTable(pendingTableId);
    setOrderType('dine_in');
    const orderNum = await getNextOrderNumber(detectedSession.id);
    setNextOrderNumber(orderNum);

    // Precompila cliente se presente nella sessione
    if (detectedSession.customer_name) setCustomerName(detectedSession.customer_name);
    if (detectedSession.customer_phone) setCustomerPhone(detectedSession.customer_phone);

    setShowSessionDetectedModal(false);
    setDetectedSession(null);
    setDetectedSessionOrders([]);
    setPendingTableId(null);

    showToast('Comanda associata al conto aperto', 'success');
  }

  // Rifiuta e crea ordine senza sessione (ordine singolo)
  function cancelAddToSession() {
    if (pendingTableId) {
      setSelectedTable(pendingTableId);
    }
    setShowSessionDetectedModal(false);
    setDetectedSession(null);
    setDetectedSessionOrders([]);
    setPendingTableId(null);
  }

  async function submitOrder() {
    if (cart.length === 0) {
      showToast('Aggiungi almeno un prodotto', 'warning');
      return;
    }

    // Per ordini al tavolo senza sessione, richiedi un tavolo
    if (orderType === 'dine_in' && !selectedTable && !activeSession) {
      showToast('Seleziona un tavolo', 'warning');
      return;
    }

    setIsSubmitting(true);

    try {
      // Per sessioni attive, il totale non include IVA separata (già inclusa nel prezzo)
      // e non serve metodo pagamento (si fa alla chiusura conto)
      const order = {
        date: new Date().toISOString().split('T')[0],
        total: activeSession ? cartTotal : grandTotal, // Per sessione usa cartTotal senza IVA separata
        payment_method: activeSession ? 'cash' : paymentMethod, // Placeholder per sessioni
        order_type: orderType,
        table_id: orderType === 'dine_in' ? selectedTable ?? undefined : undefined,
        notes: notes || undefined,
        status: 'pending' as const,
        smac_passed: activeSession ? false : smacPassed, // SMAC si gestisce alla chiusura
        customer_name: customerName || undefined,
        customer_phone: customerPhone || undefined,
        // Campi sessione
        session_id: activeSession?.id,
        order_number: activeSession ? nextOrderNumber : undefined,
      };

      const items = cart.map((item) => ({
        menu_item_id: item.id,
        quantity: item.quantity,
        price: item.price,
        notes: item.notes,
      }));

      await createOrder(order, items);

      // Se c'è una sessione, aggiorna il totale della sessione
      if (activeSession) {
        await updateSessionTotal(activeSession.id);
        showToast(`Comanda #${nextOrderNumber} inviata!`, 'success');
        // Torna alla pagina tavoli
        navigate('/tables');
      } else {
        showToast('Ordine creato con successo!', 'success');
        navigate('/orders');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      showToast('Errore nella creazione dell\'ordine', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // Per sessioni, nascondi selezione tavolo e pagamento (già gestiti)
  const isSessionOrder = !!activeSession;

  // Props comuni per CartContent
  const cartContentProps = {
    orderType,
    setOrderType: isSessionOrder ? () => {} : setOrderType, // Blocca cambio tipo per sessioni
    selectedTable,
    setSelectedTable: isSessionOrder ? () => {} : setSelectedTable, // Blocca cambio tavolo per sessioni
    onTableSelect: isSessionOrder ? undefined : handleTableSelect, // Funzione per selezione tavolo con rilevamento sessione
    tables,
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,
    cart,
    cartItemsCount,
    cartTotal,
    ivaRate,
    ivaAmount,
    grandTotal,
    expandedItemId,
    setExpandedItemId,
    notes,
    setNotes,
    paymentMethod,
    setPaymentMethod,
    smacPassed,
    setSmacPassed,
    isSubmitting,
    clearCart,
    updateQuantity,
    removeFromCart,
    updateItemNotes,
    submitOrder,
    // Props per sessione
    isSessionOrder,
    sessionTableName: activeSession?.table_name,
    orderNumber: nextOrderNumber,
  };

  return (
    <>
      {/* DESKTOP LAYOUT */}
      <div className="hidden lg:flex gap-4 h-[calc(100vh-100px)]">
        {/* Left side - Products */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Categories */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-6 py-3 rounded-xl font-medium whitespace-nowrap transition-all ${
                  selectedCategory === category.id
                    ? 'bg-primary-500 text-dark-900'
                    : 'bg-dark-800 text-dark-300 hover:bg-dark-700'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => addToCart(item)}
                  className="menu-item-card text-left"
                >
                  <h3 className="font-semibold text-white mb-1 line-clamp-2">
                    {item.name}
                  </h3>
                  {item.description && (
                    <p className="text-sm text-dark-400 mb-2 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                  <p className="text-xl font-bold text-primary-400">
                    €{item.price.toFixed(2)}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right side - Cart (Desktop) */}
        <div className="w-[420px] flex flex-col bg-dark-800 rounded-2xl border border-dark-700">
          <CartContent {...cartContentProps} />
        </div>
      </div>

      {/* MOBILE LAYOUT */}
      <div className="lg:hidden flex flex-col h-[calc(100vh-120px)]">
        {/* Categories - Horizontal scroll */}
        <div className="flex gap-2 mb-3 overflow-x-auto pb-2 -mx-3 px-3">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all text-sm ${
                selectedCategory === category.id
                  ? 'bg-primary-500 text-dark-900'
                  : 'bg-dark-800 text-dark-300'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Products Grid - Mobile optimized */}
        <div className="flex-1 overflow-y-auto -mx-3 px-3 pb-24">
          <div className="grid grid-cols-2 gap-2">
            {filteredItems.map((item) => {
              const inCart = cart.find((c) => c.id === item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => addToCart(item)}
                  className="relative bg-dark-800 rounded-xl p-3 text-left active:scale-[0.98] transition-transform border border-dark-700"
                >
                  {inCart && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center text-xs font-bold text-dark-900">
                      {inCart.quantity}
                    </div>
                  )}
                  <h3 className="font-semibold text-white text-sm line-clamp-2 mb-1">
                    {item.name}
                  </h3>
                  <p className="text-lg font-bold text-primary-400">
                    €{item.price.toFixed(2)}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile Cart Bar - Fixed bottom */}
        <div className="fixed bottom-0 left-0 right-0 bg-dark-900 border-t border-dark-700 lg:hidden z-30 safe-bottom">
          <button
            onClick={() => setMobileCartOpen(true)}
            className="w-full flex items-center justify-between p-4"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <ShoppingCart className="w-6 h-6 text-primary-400" />
                {cartItemsCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center text-xs font-bold text-dark-900">
                    {cartItemsCount}
                  </span>
                )}
              </div>
              <span className="text-white font-medium">
                {cart.length === 0 ? 'Carrello vuoto' : `${cartItemsCount} articoli`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-primary-400">
                €{grandTotal.toFixed(2)}
              </span>
              <ChevronUp className="w-5 h-5 text-dark-400" />
            </div>
          </button>
        </div>

        {/* Mobile Cart Panel - Full screen slide up */}
        {mobileCartOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => setMobileCartOpen(false)}
            />

            {/* Panel */}
            <div className="absolute bottom-0 left-0 right-0 bg-dark-800 rounded-t-3xl max-h-[90vh] flex flex-col animate-slide-up">
              {/* Handle bar */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-12 h-1.5 bg-dark-600 rounded-full" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-dark-700">
                <h2 className="text-lg font-bold text-white">Il tuo ordine</h2>
                <button
                  onClick={() => setMobileCartOpen(false)}
                  className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-dark-400" />
                </button>
              </div>

              {/* Cart Content */}
              <div className="flex-1 overflow-y-auto">
                <CartContent {...cartContentProps} isMobile />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CSS for animations */}
      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        .safe-bottom {
          padding-bottom: env(safe-area-inset-bottom, 0);
        }
        .pb-safe {
          padding-bottom: env(safe-area-inset-bottom, 12px);
        }
      `}</style>

      {/* Modal rilevamento conto aperto */}
      <Modal
        isOpen={showSessionDetectedModal}
        onClose={() => setShowSessionDetectedModal(false)}
        title="Conto Aperto Rilevato"
        size="md"
      >
        {detectedSession && (
          <div className="space-y-6">
            {/* Alert */}
            <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
              <AlertCircle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-400">
                  Questo tavolo ha già un conto aperto
                </p>
                <p className="text-sm text-dark-300 mt-1">
                  Vuoi aggiungere la comanda al conto esistente?
                </p>
              </div>
            </div>

            {/* Session Info */}
            <div className="p-4 bg-dark-900 rounded-xl">
              <h3 className="font-semibold text-white mb-3">
                {detectedSession.table_name || `Tavolo ${detectedSession.table_id}`}
              </h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="flex items-center justify-center gap-1 text-dark-400">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">Coperti</span>
                  </div>
                  <p className="text-lg font-bold text-white">{detectedSession.covers}</p>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1 text-dark-400">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">Comande</span>
                  </div>
                  <p className="text-lg font-bold text-white">{detectedSessionOrders.length}</p>
                </div>
                <div>
                  <p className="text-sm text-dark-400">Totale</p>
                  <p className="text-lg font-bold text-primary-400">€{detectedSession.total.toFixed(2)}</p>
                </div>
              </div>

              {detectedSession.customer_name && (
                <p className="mt-3 text-sm text-dark-400">
                  Cliente: <span className="text-white">{detectedSession.customer_name}</span>
                </p>
              )}

              {/* Lista comande esistenti */}
              {detectedSessionOrders.length > 0 && (
                <div className="mt-4 pt-4 border-t border-dark-700">
                  <p className="text-sm text-dark-400 mb-2">Comande esistenti:</p>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {detectedSessionOrders.map((order) => (
                      <div key={order.id} className="flex justify-between text-sm">
                        <span className="text-dark-300">Comanda #{order.order_number || 1}</span>
                        <span className="text-white">€{order.total.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <button
                onClick={confirmAddToSession}
                className="btn-primary w-full py-3"
              >
                Sì, aggiungi al conto
              </button>
              <button
                onClick={cancelAddToSession}
                className="btn-secondary w-full"
              >
                No, crea ordine separato
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
