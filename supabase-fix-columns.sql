-- ============================================
-- RESTAURANT MANAGER - FIX COLONNE MANCANTI
-- ============================================
-- Esegui questo script se hai errori di salvataggio
-- Dashboard > SQL Editor > New query > Incolla e Run
-- ============================================

-- Aggiungi employee_id alla tabella users (per collegamento utente-dipendente)
ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL;

-- Aggiungi smac_passed alla tabella session_payments (per SMAC nei pagamenti parziali)
ALTER TABLE session_payments ADD COLUMN IF NOT EXISTS smac_passed BOOLEAN DEFAULT false;

-- Aggiungi paid_items alla tabella session_payments (per tracciare items pagati nel split bill)
ALTER TABLE session_payments ADD COLUMN IF NOT EXISTS paid_items JSONB DEFAULT '[]';

-- ============================================
-- VERIFICA
-- ============================================
-- Dopo aver eseguito, vai su Table Editor:
-- 1. Clicca su "users" - dovresti vedere la colonna employee_id
-- 2. Clicca su "session_payments" - dovresti vedere le colonne smac_passed e paid_items

-- ============================================
-- FINE SCRIPT
-- ============================================
