# Guida Setup Nuovo Cliente

Questa guida spiega come configurare Restaurant Manager per un nuovo ristorante.

---

## Prerequisiti per il Cliente

Il ristoratore deve avere (o creare):
1. **Account Google** (per creare gli altri account)
2. **Account GitHub** (gratuito) - [github.com](https://github.com)
3. **Account Supabase** (gratuito) - [supabase.com](https://supabase.com)

---

## Step 1: Creare il Repository del Cliente

### Opzione A: Fork (consigliata per aggiornamenti facili)

1. Accedi a GitHub con l'account del cliente
2. Vai su: `https://github.com/andreafabbri97/restaurant-manager`
3. Clicca **Fork** in alto a destra
4. Rinomina se vuoi (es. `ristorante-mario`)
5. Clicca **Create fork**

### Opzione B: Template (copia indipendente)

1. Vai su: `https://github.com/andreafabbri97/restaurant-manager`
2. Clicca **Use this template** > **Create a new repository**
3. Inserisci nome repository
4. Clicca **Create repository**

---

## Step 2: Configurare Supabase

1. Accedi a [supabase.com](https://supabase.com) con l'account del cliente
2. Clicca **New project**
3. Compila:
   - **Name**: Nome del ristorante (es. `ristorante-mario`)
   - **Database Password**: genera una password sicura (salvala!)
   - **Region**: `Central EU (Frankfurt)` per Italia
4. Clicca **Create new project** (attendi 2-3 minuti)

### Creare le tabelle

1. Nel progetto, vai su **SQL Editor**
2. Clicca **New query**
3. Copia e incolla il contenuto di `supabase-schema.sql`
4. Clicca **Run**
5. Verifica: vai su **Table Editor**, dovresti vedere tutte le tabelle

### Abilitare RLS (Row Level Security)

1. Vai su **SQL Editor**
2. Clicca **New query**
3. Copia e incolla il contenuto di `supabase-rls-policies.sql`
4. Clicca **Run**

### Ottenere le credenziali

1. Vai su **Settings** > **API**
2. Copia:
   - **Project URL** (es. `https://xxxxx.supabase.co`)
   - **anon public key** (la chiave lunga)

---

## Step 3: Configurare il Repository

### Modificare le credenziali Supabase

1. Nel repository del cliente, vai su `src/lib/supabase.ts`
2. Clicca l'icona matita per modificare
3. Sostituisci:

```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://XXXXX.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJ...CHIAVE_DEL_CLIENTE...';
```

4. Clicca **Commit changes**

### Modificare il nome dell'app (opzionale)

1. Modifica `vite.config.ts`:
   - Cambia `base` da `/restaurant-manager/` a `/nome-repo-cliente/`
   - Cambia `name` nel manifest PWA

2. Modifica `package.json`:
   - Cambia `homepage` con l'URL GitHub Pages del cliente

3. Modifica `index.html`:
   - Cambia i riferimenti al nome app

---

## Step 4: Abilitare GitHub Pages

1. Nel repository del cliente, vai su **Settings** > **Pages**
2. In **Source**, seleziona **GitHub Actions**
3. Torna al repo, vai su **Actions**
4. Se vedi "Workflows aren't being run", clicca **I understand my workflows, go ahead and enable them**

---

## Step 5: Deploy

### Metodo 1: Push manuale

1. Fai una qualsiasi modifica (anche solo un commento)
2. Il workflow si attiva automaticamente
3. Attendi 2-3 minuti
4. L'app sarà disponibile su: `https://ACCOUNT_CLIENTE.github.io/NOME_REPO/`

### Metodo 2: Trigger manuale

1. Vai su **Actions** > **Deploy to GitHub Pages**
2. Clicca **Run workflow**
3. Attendi il completamento

---

## Step 6: Configurazione Iniziale App

Quando l'app è online:

1. Accedi con: `admin` / `admin123`
2. Vai su **Impostazioni**:
   - Nome negozio
   - Indirizzo, telefono, email
   - IVA (17% per San Marino, 22% per Italia)
   - Valuta
3. Vai su **Utenti**:
   - Cambia password admin
   - Crea account per dipendenti
4. Vai su **Menu**:
   - Aggiungi categorie
   - Aggiungi piatti

---

## Aggiornamenti Futuri

### Per clienti con Fork

```bash
# Dal terminale, nel repo del cliente
git remote add upstream https://github.com/andreafabbri97/restaurant-manager.git
git fetch upstream
git merge upstream/main
git push origin main
```

Oppure chiedimi di farlo!

### Per clienti con Template

Devo copiare manualmente le modifiche.

---

## Checklist Deploy Nuovo Cliente

- [ ] Account GitHub cliente creato
- [ ] Account Supabase cliente creato
- [ ] Fork/Template del repository creato
- [ ] Progetto Supabase creato
- [ ] Schema SQL eseguito
- [ ] RLS policies eseguite
- [ ] Credenziali Supabase aggiornate in `supabase.ts`
- [ ] GitHub Pages abilitato
- [ ] Deploy completato
- [ ] Login testato (admin/admin123)
- [ ] Impostazioni configurate (nome, IVA, ecc.)
- [ ] Password admin cambiata
- [ ] Utenti staff creati
- [ ] Menu configurato

---

## Limiti Free Tier

### GitHub Free
- Repository pubblici illimitati
- Repository privati illimitati
- GitHub Pages: solo da repo pubblici

### Supabase Free (per progetto)
- 500 MB database
- 1 GB file storage
- 2 GB bandwidth/mese
- 50,000 utenti attivi/mese

**Nota**: Ogni ristorante ha il SUO progetto Supabase, quindi ognuno ha 500 MB.

---

## Troubleshooting

### "Error loading data" all'avvio
- Controlla che le credenziali Supabase siano corrette
- Verifica che le tabelle esistano in Supabase

### GitHub Pages non funziona
- Verifica che il repo sia pubblico O che il cliente abbia GitHub Pro
- Controlla che GitHub Actions sia abilitato

### Ordini non si aggiornano in tempo reale
- Supabase Realtime potrebbe essere disabilitato
- Controlla la connessione internet

---

*Documento interno - Andrea Fabbri*
