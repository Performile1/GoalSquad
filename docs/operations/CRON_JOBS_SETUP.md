# Supabase Cron Jobs Setup

## Översikt
Denna dokumentation beskriver alla schemalagda uppgifter (cron jobs) som ska köras i Goalsquad-systemet.

## Cron Jobs

### 1. Kampanjutvärdering (MOQ Evaluation)
**Endpoint:** `/api/workers/campaign-evaluation`  
**Frekvens:** Varje timme (0 * * * *)  
**Syfte:** Utvärderar aktiva kampanjer som nått slutdatum och beslutar om MOQ är uppnått eller misslyckat

**Setup:**
```bash
# I Supabase Dashboard -> Edge Functions -> Cron Jobs
# Eller via extern cron-tjänst (t.ex. cron-job.org, GitHub Actions)

curl -X POST https://din-domän.se/api/workers/campaign-evaluation \
  -H "Content-Type: application/json" \
  -d '{"secret": "DIN_CRON_SECRET"}'
```

**Miljövariabler:**
- `CRON_SECRET` - Hemlig nyckel för att verifiera cron-anrop

---

### 2. Notifieringssköp (Pending)
**Endpoint:** TBD  
**Frekvens:** Var 5:e minut  
**Syfte:** Skickar notifieringar för nya ordrar, kampanjstatus, etc.

---

### 3. Rapportgenerering (Pending)
**Endpoint:** `/api/admin/reports/generate`  
**Frekvens:** Dagligen kl 02:00  
**Syfte:** Genererar automatiska rapporter för säljare och administratörer

---

### 4. Systemhälsokontroll (Pending)
**Endpoint:** `/api/admin/system/health`  
**Frekvens:** Var 15:e minut  
**Syfte:** Monitorerar systemhälsa och larmar vid problem

---

## Extern Cron Service (Rekommenderat)

För bättre kontroll och loggning rekommenderas att använda en extern cron-tjänst:

### GitHub Actions (Gratis för repos)
```yaml
# .github/workflows/campaign-evaluation.yml
name: Campaign Evaluation
on:
  schedule:
    - cron: '0 * * * *'  # Varje timme
  workflow_dispatch:

jobs:
  evaluate:
    runs-on: ubuntu-latest
    steps:
      - name: Run Campaign Evaluation
        run: |
          curl -X POST ${{ secrets.API_URL }}/api/workers/campaign-evaluation \
            -H "Content-Type: application/json" \
            -d '{"secret": "${{ secrets.CRON_SECRET }}"}'
```

### Cron-job.org (Enkelt alternativ)
1. Gå till https://cron-job.org
2. Skapa nytt cron-job
3. URL: `https://din-domän.se/api/workers/campaign-evaluation`
4. Method: POST
5. Body: `{"secret": "DIN_CRON_SECRET"}`
6. Schedule: `0 * * * *`

---

## Supabase Edge Functions Cron (Alternativ)

Supabase har inbyggt stöd för cron jobs via pg_cron:

```sql
-- Aktivera pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Skapa cron-jobb som anropar Edge Function via http extension
SELECT cron.schedule(
  'campaign-evaluation-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://din-domän.se/api/workers/campaign-evaluation',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object('secret', current_setting('app.cron_secret'))
  );
  $$
);
```

**Obs:** Kräver att `http` extension är aktiverad i Supabase.
