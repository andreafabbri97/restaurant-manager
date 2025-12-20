-- ============================================
-- RESTAURANT MANAGER - RLS POLICIES
-- ============================================
-- Esegui questo script nel SQL Editor di Supabase
-- Dashboard > SQL Editor > New query > Incolla e Run
--
-- IMPORTANTE: Prima di eseguire questo script:
-- 1. Vai su Supabase Dashboard > Settings > API
-- 2. In "API Settings" > "Allowed origins" aggiungi:
--    - https://andreafabbri97.github.io
--    - http://localhost:5173 (per sviluppo locale)
-- Questo limita l'accesso solo dal tuo dominio!

-- ============================================
-- ABILITA RLS SU TUTTE LE TABELLE
-- ============================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_item_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredient_consumptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplies ENABLE ROW LEVEL SECURITY;
ALTER TABLE supply_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_closures ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_payments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLICY: Permetti tutto con anon key
-- ============================================
-- Queste policy permettono accesso completo.
-- La sicurezza viene dalle "Allowed Origins" in Supabase Dashboard
-- che limitano l'accesso solo al tuo dominio.

-- CATEGORIES
CREATE POLICY "Allow all on categories" ON categories FOR ALL USING (true) WITH CHECK (true);

-- INGREDIENTS
CREATE POLICY "Allow all on ingredients" ON ingredients FOR ALL USING (true) WITH CHECK (true);

-- MENU_ITEMS
CREATE POLICY "Allow all on menu_items" ON menu_items FOR ALL USING (true) WITH CHECK (true);

-- MENU_ITEM_INGREDIENTS
CREATE POLICY "Allow all on menu_item_ingredients" ON menu_item_ingredients FOR ALL USING (true) WITH CHECK (true);

-- INVENTORY
CREATE POLICY "Allow all on inventory" ON inventory FOR ALL USING (true) WITH CHECK (true);

-- INGREDIENT_CONSUMPTIONS
CREATE POLICY "Allow all on ingredient_consumptions" ON ingredient_consumptions FOR ALL USING (true) WITH CHECK (true);

-- TABLES
CREATE POLICY "Allow all on tables" ON tables FOR ALL USING (true) WITH CHECK (true);

-- ORDERS
CREATE POLICY "Allow all on orders" ON orders FOR ALL USING (true) WITH CHECK (true);

-- ORDER_ITEMS
CREATE POLICY "Allow all on order_items" ON order_items FOR ALL USING (true) WITH CHECK (true);

-- EMPLOYEES
CREATE POLICY "Allow all on employees" ON employees FOR ALL USING (true) WITH CHECK (true);

-- WORK_SHIFTS
CREATE POLICY "Allow all on work_shifts" ON work_shifts FOR ALL USING (true) WITH CHECK (true);

-- RESERVATIONS
CREATE POLICY "Allow all on reservations" ON reservations FOR ALL USING (true) WITH CHECK (true);

-- EXPENSES
CREATE POLICY "Allow all on expenses" ON expenses FOR ALL USING (true) WITH CHECK (true);

-- SUPPLIES
CREATE POLICY "Allow all on supplies" ON supplies FOR ALL USING (true) WITH CHECK (true);

-- SUPPLY_ITEMS
CREATE POLICY "Allow all on supply_items" ON supply_items FOR ALL USING (true) WITH CHECK (true);

-- SETTINGS
CREATE POLICY "Allow all on settings" ON settings FOR ALL USING (true) WITH CHECK (true);

-- USERS (tabella sensibile - considera policy più restrittive in futuro)
CREATE POLICY "Allow all on users" ON users FOR ALL USING (true) WITH CHECK (true);

-- CASH_CLOSURES
CREATE POLICY "Allow all on cash_closures" ON cash_closures FOR ALL USING (true) WITH CHECK (true);

-- TABLE_SESSIONS
CREATE POLICY "Allow all on table_sessions" ON table_sessions FOR ALL USING (true) WITH CHECK (true);

-- SESSION_PAYMENTS
CREATE POLICY "Allow all on session_payments" ON session_payments FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- VERIFICA
-- ============================================
-- Dopo aver eseguito questo script, verifica che tutto funzioni:
-- 1. L'app deve continuare a funzionare normalmente
-- 2. Vai su Supabase > Table Editor > seleziona una tabella
-- 3. Dovresti vedere "RLS enabled" e le policy create

-- ============================================
-- FINE SCRIPT
-- ============================================
