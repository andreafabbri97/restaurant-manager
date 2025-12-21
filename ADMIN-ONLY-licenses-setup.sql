-- ============================================
-- SISTEMA LICENZE - SOLO PER IL TUO SUPABASE CENTRALE
-- ============================================
-- Versione: 2.0
-- Data: Dicembre 2024
--
-- ATTENZIONE: NON CONDIVIDERE QUESTO FILE CON I CLIENTI!
-- Questo script va eseguito SOLO nel tuo Supabase principale
-- (quello usato dal pannello restaurant-manager-admin)
--
-- Dashboard > SQL Editor > New query > Incolla e Run
-- ============================================

-- ============== TABELLA LICENSES ==============
CREATE TABLE IF NOT EXISTS licenses (
  id SERIAL PRIMARY KEY,

  -- Identificazione cliente
  client_id VARCHAR(50) NOT NULL UNIQUE,  -- Es: "kebab-roma", "pizzeria-milano"
  client_name VARCHAR(100) NOT NULL,       -- Nome visualizzato: "Kebab Roma Centro"

  -- Informazioni contratto
  owner_name VARCHAR(100) NOT NULL,        -- Nome titolare: "Mario Rossi"
  owner_email VARCHAR(100),                -- Email per comunicazioni
  owner_phone VARCHAR(30),                 -- Telefono

  -- Stato licenza
  status VARCHAR(20) NOT NULL DEFAULT 'active',  -- active, suspended, expired, cancelled

  -- Date
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE NOT NULL,               -- Data scadenza (rinnovo annuale)

  -- Configurazione tecnica cliente
  supabase_url TEXT,                       -- URL Supabase del cliente
  supabase_anon_key TEXT,                  -- Anon key Supabase del cliente
  supabase_db_password TEXT,               -- Password DB Supabase cliente
  frontend_url TEXT,                       -- URL frontend (es: cliente.vercel.app)
  github_repo VARCHAR(100),                -- Nome repo fork: "kebab-roma-app"
  github_username TEXT,                    -- Username GitHub cliente
  github_password TEXT,                    -- Password/token GitHub cliente
  google_email TEXT,                       -- Email Google cliente

  -- Piano e pagamento
  plan_type VARCHAR(20) DEFAULT 'standard', -- demo, standard, premium
  monthly_fee DECIMAL(10, 2) DEFAULT 0,     -- Canone mensile
  setup_fee DECIMAL(10, 2) DEFAULT 0,       -- Fee setup iniziale
  last_payment_date DATE,                   -- Ultimo pagamento ricevuto

  -- Note
  notes TEXT,

  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Aggiungi colonne se tabella già esiste (per upgrade)
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS supabase_anon_key TEXT;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS supabase_db_password TEXT;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS frontend_url TEXT;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS github_username TEXT;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS github_password TEXT;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS google_email TEXT;

-- Index per ricerche veloci
CREATE INDEX IF NOT EXISTS idx_licenses_client_id ON licenses(client_id);
CREATE INDEX IF NOT EXISTS idx_licenses_status ON licenses(status);
CREATE INDEX IF NOT EXISTS idx_licenses_expiry ON licenses(expiry_date);

-- ============== TABELLA ADMIN SETTINGS ==============
-- Contiene le impostazioni del messaggio di blocco mostrato ai clienti
CREATE TABLE IF NOT EXISTS admin_settings (
  id SERIAL PRIMARY KEY,
  blocked_title TEXT NOT NULL DEFAULT 'Licenza Non Valida',
  blocked_message TEXT NOT NULL DEFAULT 'La tua licenza è scaduta o è stata sospesa. Per continuare ad utilizzare il software, contatta il supporto.',
  blocked_contact_email TEXT DEFAULT 'support@example.com',
  blocked_contact_phone TEXT DEFAULT '+39 333 1234567',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserisci valori default se tabella vuota
INSERT INTO admin_settings (blocked_title, blocked_message, blocked_contact_email, blocked_contact_phone)
SELECT
  'Licenza Non Valida',
  'La tua licenza è scaduta o è stata sospesa. Per continuare ad utilizzare il software, contatta il supporto.',
  'support@example.com',
  '+39 333 1234567'
WHERE NOT EXISTS (SELECT 1 FROM admin_settings);

-- ============== TRIGGER PER AGGIORNARE updated_at ==============
CREATE OR REPLACE FUNCTION update_licenses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_licenses_updated_at ON licenses;
CREATE TRIGGER trigger_licenses_updated_at
  BEFORE UPDATE ON licenses
  FOR EACH ROW
  EXECUTE FUNCTION update_licenses_updated_at();

CREATE OR REPLACE FUNCTION update_admin_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_admin_settings_timestamp ON admin_settings;
CREATE TRIGGER update_admin_settings_timestamp
  BEFORE UPDATE ON admin_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_settings_updated_at();

-- ============== FUNZIONE RPC PER VERIFICA LICENZA ==============
-- Questa funzione viene chiamata dal software client per verificare la licenza
-- È sicura perché ritorna solo info pubbliche, non credenziali

CREATE OR REPLACE FUNCTION check_license(p_client_id TEXT)
RETURNS JSON AS $$
DECLARE
  v_license RECORD;
  v_result JSON;
BEGIN
  -- Cerca la licenza per client_id
  SELECT * INTO v_license
  FROM licenses
  WHERE client_id = p_client_id;

  -- Se non trovata
  IF NOT FOUND THEN
    RETURN json_build_object(
      'valid', false,
      'reason', 'not_found',
      'message', 'Licenza non trovata per questo client_id'
    );
  END IF;

  -- Controlla lo stato
  IF v_license.status = 'cancelled' THEN
    RETURN json_build_object(
      'valid', false,
      'reason', 'cancelled',
      'message', 'La licenza è stata cancellata'
    );
  END IF;

  IF v_license.status = 'suspended' THEN
    RETURN json_build_object(
      'valid', false,
      'reason', 'suspended',
      'message', 'La licenza è stata sospesa'
    );
  END IF;

  -- Controlla scadenza
  IF v_license.expiry_date < CURRENT_DATE THEN
    -- Aggiorna stato a expired se non già fatto
    UPDATE licenses SET status = 'expired' WHERE id = v_license.id AND status != 'expired';

    RETURN json_build_object(
      'valid', false,
      'reason', 'expired',
      'message', 'La licenza è scaduta',
      'expiryDate', v_license.expiry_date
    );
  END IF;

  -- Licenza valida
  RETURN json_build_object(
    'valid', true,
    'reason', 'active',
    'plan', v_license.plan_type,
    'expiryDate', v_license.expiry_date,
    'clientName', v_license.client_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============== LA TUA LICENZA (PROPRIETARIO) ==============
-- Inserisci la tua licenza - non scade mai, piano premium
INSERT INTO licenses (
  client_id,
  client_name,
  owner_name,
  owner_email,
  status,
  start_date,
  expiry_date,
  plan_type,
  notes
) VALUES (
  'kebab-san-marino',
  'Kebab San Marino',
  'Andrea Fabbri',
  'andrea@example.com',
  'active',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '100 years',
  'premium',
  'Licenza sviluppatore - proprietario del software'
) ON CONFLICT (client_id) DO NOTHING;

-- ============================================
-- COMANDI UTILI
-- ============================================
--
-- AGGIUNGERE NUOVO CLIENTE:
-- INSERT INTO licenses (client_id, client_name, owner_name, owner_email, expiry_date, plan_type)
-- VALUES ('pizzeria-roma', 'Pizzeria Roma', 'Mario Rossi', 'mario@email.com', '2026-01-15', 'standard');
--
-- SOSPENDERE CLIENTE (non paga):
-- UPDATE licenses SET status = 'suspended' WHERE client_id = 'pizzeria-roma';
--
-- RIATTIVARE CLIENTE:
-- UPDATE licenses SET status = 'active' WHERE client_id = 'pizzeria-roma';
--
-- RINNOVARE LICENZA (+1 anno):
-- UPDATE licenses SET expiry_date = expiry_date + INTERVAL '1 year' WHERE client_id = 'pizzeria-roma';
--
-- CAMBIARE PIANO:
-- UPDATE licenses SET plan_type = 'premium' WHERE client_id = 'pizzeria-roma';
--
-- VERIFICARE LICENZA (test):
-- SELECT check_license('pizzeria-roma');
--
-- ============================================
-- FINE SCRIPT
-- ============================================
