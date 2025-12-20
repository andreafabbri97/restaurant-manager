-- ============================================
-- TABELLA LICENZE - SOLO PER IL TUO SUPABASE
-- ============================================
-- ATTENZIONE: NON CONDIVIDERE QUESTO FILE CON I CLIENTI!
-- Questo script va eseguito SOLO nel tuo Supabase principale
-- Dashboard > SQL Editor > New query > Incolla e Run
-- ============================================

-- ============== LICENSES ==============
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

  -- Configurazione
  supabase_url TEXT,                       -- URL Supabase del cliente (per riferimento)
  github_repo VARCHAR(100),                -- Nome repo fork: "kebab-roma-app"

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

-- Index per ricerche veloci
CREATE INDEX IF NOT EXISTS idx_licenses_client_id ON licenses(client_id);
CREATE INDEX IF NOT EXISTS idx_licenses_status ON licenses(status);
CREATE INDEX IF NOT EXISTS idx_licenses_expiry ON licenses(expiry_date);

-- ============== FUNZIONE PER AGGIORNARE updated_at ==============
CREATE OR REPLACE FUNCTION update_licenses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger per aggiornamento automatico
DROP TRIGGER IF EXISTS trigger_licenses_updated_at ON licenses;
CREATE TRIGGER trigger_licenses_updated_at
  BEFORE UPDATE ON licenses
  FOR EACH ROW
  EXECUTE FUNCTION update_licenses_updated_at();

-- ============== API ENDPOINT PER VERIFICA LICENZA ==============
-- Questa funzione viene chiamata dai client per verificare la licenza
-- È sicura perché ritorna solo lo status, non informazioni sensibili

CREATE OR REPLACE FUNCTION check_license(p_client_id TEXT)
RETURNS JSON AS $$
DECLARE
  v_license RECORD;
  v_result JSON;
BEGIN
  SELECT status, expiry_date, plan_type
  INTO v_license
  FROM licenses
  WHERE client_id = p_client_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'valid', false,
      'reason', 'not_found',
      'message', 'Licenza non trovata'
    );
  END IF;

  -- Controlla se scaduta
  IF v_license.expiry_date < CURRENT_DATE THEN
    RETURN json_build_object(
      'valid', false,
      'reason', 'expired',
      'message', 'Licenza scaduta',
      'expiry_date', v_license.expiry_date
    );
  END IF;

  -- Controlla se sospesa o cancellata
  IF v_license.status != 'active' THEN
    RETURN json_build_object(
      'valid', false,
      'reason', v_license.status,
      'message', 'Licenza ' || v_license.status
    );
  END IF;

  -- Licenza valida
  RETURN json_build_object(
    'valid', true,
    'plan', v_license.plan_type,
    'expiry_date', v_license.expiry_date
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============== DATI ESEMPIO ==============
-- Inserisci la tua prima licenza (la tua app principale)
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
  CURRENT_DATE + INTERVAL '10 years',  -- La tua licenza non scade mai
  'premium',
  'Licenza sviluppatore - proprietario del software'
) ON CONFLICT (client_id) DO NOTHING;

-- ============================================
-- COME USARE
-- ============================================
--
-- AGGIUNGERE NUOVO CLIENTE:
-- INSERT INTO licenses (client_id, client_name, owner_name, owner_email, expiry_date)
-- VALUES ('pizzeria-roma', 'Pizzeria Roma', 'Mario Rossi', 'mario@email.com', '2026-01-15');
--
-- SOSPENDERE CLIENTE (non paga):
-- UPDATE licenses SET status = 'suspended' WHERE client_id = 'pizzeria-roma';
--
-- RIATTIVARE CLIENTE:
-- UPDATE licenses SET status = 'active', expiry_date = '2026-01-15' WHERE client_id = 'pizzeria-roma';
--
-- RINNOVARE LICENZA:
-- UPDATE licenses SET expiry_date = expiry_date + INTERVAL '1 year' WHERE client_id = 'pizzeria-roma';
--
-- VERIFICARE LICENZA (usato dal client):
-- SELECT check_license('pizzeria-roma');
--
-- ============================================
-- FINE SCRIPT
-- ============================================
