import {
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  CreditCard,
  Banknote,
  Smartphone,
  Users,
  Clock,
  Bike,
  Check,
  MessageSquare,
} from 'lucide-react';
import type { Table, CartItem } from '../../types';

type OrderType = 'dine_in' | 'takeaway' | 'delivery';
type PaymentMethod = 'cash' | 'card' | 'online';

interface CartContentProps {
  isMobile?: boolean;
  orderType: OrderType;
  setOrderType: (type: OrderType) => void;
  selectedTable: number | null;
  setSelectedTable: (id: number) => void;
  onTableSelect?: (id: number) => void; // Per rilevamento conto aperto
  tables: Table[];
  customerName: string;
  setCustomerName: (name: string) => void;
  customerPhone: string;
  setCustomerPhone: (phone: string) => void;
  cart: CartItem[];
  cartItemsCount: number;
  cartTotal: number;
  ivaRate: number;
  ivaAmount: number;
  grandTotal: number;
  expandedItemId: number | null;
  setExpandedItemId: (id: number | null) => void;
  notes: string;
  setNotes: (notes: string) => void;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
  smacPassed: boolean;
  setSmacPassed: (passed: boolean) => void;
  isSubmitting: boolean;
  clearCart: () => void;
  updateQuantity: (itemId: number, delta: number) => void;
  removeFromCart: (itemId: number) => void;
  updateItemNotes: (itemId: number, notes: string) => void;
  submitOrder: () => void;
  // Props per sessione (conto aperto)
  isSessionOrder?: boolean;
  sessionTableName?: string;
  orderNumber?: number;
}

export function CartContent({
  isMobile = false,
  orderType,
  setOrderType,
  selectedTable,
  setSelectedTable,
  onTableSelect,
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
  isSessionOrder = false,
  sessionTableName,
  orderNumber,
}: CartContentProps) {
  return (
    <div className={`flex flex-col ${isMobile ? 'h-full' : ''}`}>
      {/* Session Header - Se è un ordine per sessione */}
      {isSessionOrder && (
        <div className="p-3 bg-primary-500/10 border-b border-primary-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-primary-400 font-medium">Comanda #{orderNumber}</p>
              <p className="text-lg font-bold text-white">{sessionTableName}</p>
            </div>
            <div className="px-3 py-1 bg-primary-500/20 rounded-lg">
              <span className="text-sm font-medium text-primary-400">Conto Aperto</span>
            </div>
          </div>
        </div>
      )}

      {/* Order Type - Nascosto per sessioni */}
      {!isSessionOrder && (
        <div className="p-3 border-b border-dark-700">
          <div className="flex gap-2">
            <button
              onClick={() => setOrderType('dine_in')}
              className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl transition-all flex-1 ${
                orderType === 'dine_in'
                  ? 'bg-primary-500 text-dark-900'
                  : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="text-sm font-medium">Tavolo</span>
            </button>
            <button
              onClick={() => setOrderType('takeaway')}
              className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl transition-all flex-1 ${
                orderType === 'takeaway'
                  ? 'bg-primary-500 text-dark-900'
                  : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
              }`}
            >
              <Clock className="w-5 h-5" />
              <span className="text-sm font-medium">Asporto</span>
            </button>
            <button
              onClick={() => setOrderType('delivery')}
              className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl transition-all flex-1 ${
                orderType === 'delivery'
                  ? 'bg-primary-500 text-dark-900'
                  : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
              }`}
            >
              <Bike className="w-5 h-5" />
              <span className="text-sm font-medium">Domicilio</span>
            </button>
          </div>

          {/* Table Selection */}
          {orderType === 'dine_in' && (
            <div className="mt-3">
              <p className="text-xs text-dark-400 mb-2">Seleziona tavolo:</p>
              <div className="flex flex-wrap gap-2">
                {tables.map((table) => (
                  <button
                    key={table.id}
                    onClick={() => onTableSelect ? onTableSelect(table.id) : setSelectedTable(table.id)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      selectedTable === table.id
                        ? 'bg-primary-500 text-dark-900'
                        : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                    }`}
                  >
                    {table.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Customer Info for delivery/takeaway */}
          {(orderType === 'takeaway' || orderType === 'delivery') && (
            <div className="mt-3 space-y-2">
              <input
                type="text"
                placeholder="Nome cliente"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="input py-2.5 text-base"
              />
              <input
                type="tel"
                placeholder="Telefono"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="input py-2.5 text-base"
              />
            </div>
          )}
        </div>
      )}

      {/* Cart Header */}
      <div className="px-3 py-2 bg-dark-900/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-primary-400" />
          <span className="text-sm font-medium text-white">
            {cartItemsCount} articoli
          </span>
        </div>
        {cart.length > 0 && (
          <button
            onClick={clearCart}
            className="text-xs text-red-400 hover:text-red-300 transition-colors px-2 py-1"
          >
            Svuota
          </button>
        )}
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-3 min-h-[150px]">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-dark-400 py-8">
            <ShoppingCart className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-sm">Carrello vuoto</p>
            <p className="text-xs mt-1">Tocca un prodotto per aggiungerlo</p>
          </div>
        ) : (
          <div className="space-y-2">
            {cart.map((item) => (
              <div key={item.id} className="bg-dark-900 rounded-xl p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-white text-sm truncate">{item.name}</h4>
                    <p className="text-xs text-primary-400 mt-0.5">
                      €{item.price.toFixed(2)} × {item.quantity} = €{(item.price * item.quantity).toFixed(2)}
                    </p>
                    {item.notes && expandedItemId !== item.id && (
                      <p className="text-xs text-amber-400 mt-1 truncate">
                        📝 {item.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setExpandedItemId(expandedItemId === item.id ? null : item.id)}
                      className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                        expandedItemId === item.id || item.notes
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-dark-700 text-dark-400 hover:bg-dark-600'
                      }`}
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="w-9 h-9 rounded-lg bg-dark-700 flex items-center justify-center hover:bg-dark-600 transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center text-base font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="w-9 h-9 rounded-lg bg-dark-700 flex items-center justify-center hover:bg-dark-600 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="w-9 h-9 ml-1 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {/* Expanded notes section */}
                {expandedItemId === item.id && (
                  <div className="mt-3 pt-3 border-t border-dark-700">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="w-4 h-4 text-amber-400" />
                      <span className="text-xs text-amber-400 font-medium">Note / Variazioni</span>
                    </div>
                    <input
                      type="text"
                      value={item.notes || ''}
                      onChange={(e) => updateItemNotes(item.id, e.target.value)}
                      placeholder="Es: senza cipolla, piccante..."
                      className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-amber-500"
                    />
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {['Senza cipolla', 'Piccante', 'Extra salsa', 'Ben cotto'].map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => {
                            const currentNotes = item.notes || '';
                            const newNote = currentNotes ? `${currentNotes}, ${suggestion}` : suggestion;
                            updateItemNotes(item.id, newNote);
                          }}
                          className="px-2.5 py-1 text-xs bg-dark-700 text-dark-300 rounded-lg hover:bg-dark-600 transition-colors"
                        >
                          + {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Section */}
      {cart.length > 0 && (
        <div className="border-t border-dark-700 bg-dark-800">
          {/* Notes */}
          <div className="px-3 py-2 border-b border-dark-700">
            <input
              type="text"
              placeholder="Note ordine (opzionale)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input py-2.5 text-base"
            />
          </div>

          {/* Payment Methods - Nascosto per sessioni (pagamento alla chiusura) */}
          {!isSessionOrder && (
            <div className="px-3 py-3 flex items-center gap-2 border-b border-dark-700">
              <div className="flex gap-2 flex-1">
                <button
                  onClick={() => setPaymentMethod('cash')}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl transition-all flex-1 ${
                    paymentMethod === 'cash'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                  }`}
                >
                  <Banknote className="w-5 h-5" />
                  <span className="text-xs font-medium">Contanti</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl transition-all flex-1 ${
                    paymentMethod === 'card'
                      ? 'bg-blue-500 text-white'
                      : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  <span className="text-xs font-medium">Carta</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('online')}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl transition-all flex-1 ${
                    paymentMethod === 'online'
                      ? 'bg-purple-500 text-white'
                      : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                  }`}
                >
                  <Smartphone className="w-5 h-5" />
                  <span className="text-xs font-medium">Online</span>
                </button>
              </div>
              <button
                onClick={() => setSmacPassed(!smacPassed)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all ${
                  smacPassed
                    ? 'bg-primary-500 text-dark-900'
                    : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                }`}
              >
                {smacPassed && <Check className="w-4 h-4" />}
                <span className="text-xs font-medium">SMAC</span>
              </button>
            </div>
          )}

          {/* Totals */}
          <div className="px-3 py-3 space-y-1">
            {isSessionOrder ? (
              // Per sessioni, mostra solo il totale comanda
              <div className="flex justify-between text-xl font-bold text-white">
                <span>Totale Comanda</span>
                <span className="text-primary-400">€{cartTotal.toFixed(2)}</span>
              </div>
            ) : (
              // Per ordini normali, mostra subtotale, IVA e totale
              <>
                <div className="flex justify-between text-sm text-dark-400">
                  <span>Subtotale</span>
                  <span>€{cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-dark-400">
                  <span>IVA ({ivaRate}%)</span>
                  <span>€{ivaAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-white pt-2">
                  <span>Totale</span>
                  <span className="text-primary-400">€{grandTotal.toFixed(2)}</span>
                </div>
              </>
            )}
          </div>

          {/* Confirm Button */}
          <div className="p-3 pt-0 pb-safe">
            <button
              onClick={submitOrder}
              disabled={cart.length === 0 || isSubmitting}
              className="btn-primary w-full py-4 text-base font-semibold"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-dark-900"></div>
              ) : isSessionOrder ? (
                <>
                  <Check className="w-5 h-5" />
                  Invia Comanda #{orderNumber} - €{cartTotal.toFixed(2)}
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Conferma Ordine - €{grandTotal.toFixed(2)}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Empty cart button */}
      {cart.length === 0 && (
        <div className="p-3 border-t border-dark-700 pb-safe">
          <button
            disabled
            className="btn-primary w-full py-4 opacity-50 cursor-not-allowed text-base"
          >
            <ShoppingCart className="w-5 h-5" />
            Aggiungi prodotti
          </button>
        </div>
      )}
    </div>
  );
}
