-- ============================================
-- KEBAB RESTAURANT - SCHEMA DATABASE SUPABASE
-- ============================================
-- Esegui questo script nel SQL Editor di Supabase
-- Dashboard > SQL Editor > New query > Incolla e Run

-- ============== CATEGORIES ==============
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(50),
  color VARCHAR(20)
);

-- ============== INGREDIENTS ==============
CREATE TABLE IF NOT EXISTS ingredients (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
  lead_time_days INTEGER DEFAULT 2,
  order_cost DECIMAL(10, 2) DEFAULT 15,
  holding_cost_percent INTEGER DEFAULT 20
);

-- ============== MENU ITEMS ==============
CREATE TABLE IF NOT EXISTS menu_items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  price DECIMAL(10, 2) NOT NULL,
  description TEXT,
  image_url TEXT,
  available BOOLEAN DEFAULT true
);

-- ============== MENU ITEM INGREDIENTS (Ricette) ==============
CREATE TABLE IF NOT EXISTS menu_item_ingredients (
  id SERIAL PRIMARY KEY,
  menu_item_id INTEGER NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  ingredient_id INTEGER NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity DECIMAL(10, 3) NOT NULL
);

-- ============== INVENTORY ==============
CREATE TABLE IF NOT EXISTS inventory (
  id SERIAL PRIMARY KEY,
  ingredient_id INTEGER NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
  threshold DECIMAL(10, 2) NOT NULL DEFAULT 10,
  UNIQUE(ingredient_id)
);

-- ============== INGREDIENT CONSUMPTIONS ==============
CREATE TABLE IF NOT EXISTS ingredient_consumptions (
  id SERIAL PRIMARY KEY,
  ingredient_id INTEGER NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  quantity_used DECIMAL(10, 3) NOT NULL,
  order_id INTEGER
);

-- ============== TABLES ==============
CREATE TABLE IF NOT EXISTS tables (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 4,
  status VARCHAR(20) DEFAULT 'available',
  current_order_id INTEGER
);

-- ============== ORDERS ==============
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(20) NOT NULL,
  order_type VARCHAR(20) NOT NULL,
  pickup_time TIME,
  table_id INTEGER REFERENCES tables(id) ON DELETE SET NULL,
  notes TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  smac_passed BOOLEAN DEFAULT false,
  customer_name VARCHAR(100),
  customer_phone VARCHAR(30),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============== ORDER ITEMS ==============
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id INTEGER NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  notes TEXT
);

-- ============== EMPLOYEES ==============
CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(50) NOT NULL,
  hourly_rate DECIMAL(10, 2) NOT NULL DEFAULT 0,
  phone VARCHAR(30),
  email VARCHAR(100),
  active BOOLEAN DEFAULT true
);

-- ============== WORK SHIFTS ==============
CREATE TABLE IF NOT EXISTS work_shifts (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  hours_worked DECIMAL(5, 2) NOT NULL DEFAULT 0,
  status VARCHAR(20) DEFAULT 'scheduled',
  shift_type VARCHAR(20) DEFAULT 'worked',
  notes TEXT,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL
);

-- ============== RESERVATIONS ==============
CREATE TABLE IF NOT EXISTS reservations (
  id SERIAL PRIMARY KEY,
  table_id INTEGER NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time TIME NOT NULL,
  customer_name VARCHAR(100) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  guests INTEGER NOT NULL DEFAULT 2,
  notes TEXT,
  status VARCHAR(20) DEFAULT 'confirmed'
);

-- ============== EXPENSES ==============
CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  description VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  category VARCHAR(50)
);

-- ============== SUPPLIES ==============
CREATE TABLE IF NOT EXISTS supplies (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  supplier_name VARCHAR(100),
  total_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============== SUPPLY ITEMS ==============
CREATE TABLE IF NOT EXISTS supply_items (
  id SERIAL PRIMARY KEY,
  supply_id INTEGER NOT NULL REFERENCES supplies(id) ON DELETE CASCADE,
  ingredient_id INTEGER NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity DECIMAL(10, 2) NOT NULL,
  unit_cost DECIMAL(10, 2) NOT NULL
);

-- ============== SETTINGS ==============
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  shop_name VARCHAR(100) DEFAULT 'Kebab San Marino',
  currency VARCHAR(10) DEFAULT 'EUR',
  iva_rate DECIMAL(5, 2) DEFAULT 17,
  default_threshold INTEGER DEFAULT 10,
  language VARCHAR(10) DEFAULT 'it',
  address TEXT,
  phone VARCHAR(30),
  email VARCHAR(100)
);

-- ============== USERS (per autenticazione app) ==============
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'staff',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- INSERIMENTO DATI DI DEFAULT
-- ============================================

-- Categorie
INSERT INTO categories (name) VALUES
  ('Kebab'),
  ('Piadine'),
  ('Bevande'),
  ('Contorni'),
  ('Dolci')
ON CONFLICT DO NOTHING;

-- Ingredienti
INSERT INTO ingredients (name, unit, cost, lead_time_days, order_cost, holding_cost_percent) VALUES
  ('Carne Kebab', 'kg', 8.00, 2, 15, 20),
  ('Pane Pita', 'pz', 0.30, 1, 10, 15),
  ('Piadina', 'pz', 0.40, 1, 10, 15),
  ('Insalata', 'kg', 3.00, 1, 10, 25),
  ('Pomodori', 'kg', 2.50, 1, 10, 25),
  ('Cipolla', 'kg', 1.50, 2, 10, 20),
  ('Salsa Yogurt', 'l', 4.00, 2, 12, 20),
  ('Salsa Piccante', 'l', 5.00, 3, 12, 20),
  ('Patatine', 'kg', 2.00, 2, 15, 15),
  ('Coca Cola 33cl', 'pz', 0.50, 3, 20, 10)
ON CONFLICT DO NOTHING;

-- Menu Items
INSERT INTO menu_items (name, category_id, price, description, available) VALUES
  ('Kebab Classico', 1, 6.00, 'Pane pita con carne, insalata, pomodori e salsa', true),
  ('Kebab Durum', 1, 7.00, 'Piadina arrotolata con carne e verdure', true),
  ('Kebab Box', 1, 8.00, 'Carne kebab con patatine in box', true),
  ('Kebab XL', 1, 9.00, 'Porzione extra large di kebab', true),
  ('Kebab Vegetariano', 1, 6.50, 'Solo verdure e salse', true),
  ('Piadina Kebab', 2, 6.50, 'Piadina con carne kebab', true),
  ('Coca Cola 33cl', 3, 2.50, 'Lattina 33cl', true),
  ('Fanta 33cl', 3, 2.50, 'Lattina 33cl', true),
  ('Acqua 50cl', 3, 1.50, 'Bottiglia 50cl', true),
  ('Birra 33cl', 3, 3.50, 'Bottiglia 33cl', true),
  ('Patatine Fritte', 4, 3.00, 'Porzione di patatine', true),
  ('Patatine Large', 4, 4.50, 'Porzione grande', true)
ON CONFLICT DO NOTHING;

-- Tavoli
INSERT INTO tables (name, capacity, status) VALUES
  ('Tavolo 1', 4, 'available'),
  ('Tavolo 2', 4, 'available'),
  ('Tavolo 3', 2, 'available'),
  ('Tavolo 4', 6, 'available'),
  ('Tavolo 5', 4, 'available'),
  ('Banco', 2, 'available')
ON CONFLICT DO NOTHING;

-- Inventario iniziale
INSERT INTO inventory (ingredient_id, quantity, threshold)
SELECT id, 50, 10 FROM ingredients
ON CONFLICT (ingredient_id) DO NOTHING;

-- Settings iniziali
INSERT INTO settings (shop_name, currency, iva_rate, default_threshold, language)
VALUES ('Kebab San Marino', 'EUR', 17, 10, 'it')
ON CONFLICT DO NOTHING;

-- Utente admin iniziale (password: admin123)
INSERT INTO users (username, password, name, role, active)
VALUES ('admin', 'admin123', 'Andrea Fabbri', 'superadmin', true)
ON CONFLICT (username) DO NOTHING;

-- ============================================
-- ABILITA ROW LEVEL SECURITY (opzionale)
-- ============================================
-- Per ora lasciamo RLS disabilitato per semplicità
-- In produzione andrebbe configurato

-- ============================================
-- FINE SCRIPT
-- ============================================
