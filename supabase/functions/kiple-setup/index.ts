import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const KIPLE_URL = "https://npugwpifxpwymyecyyhe.supabase.co";

// Full SQL setup script for the Kiple database
const SETUP_SQL_STATEMENTS = [
  // Departments
  `CREATE TABLE IF NOT EXISTS public.departments (
    id         SERIAL PRIMARY KEY,
    name       TEXT NOT NULL UNIQUE,
    color      TEXT DEFAULT '#6366F1',
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,
  // Teams
  `CREATE TABLE IF NOT EXISTS public.teams (
    id             SERIAL PRIMARY KEY,
    name           TEXT NOT NULL,
    department     TEXT NOT NULL,
    lead           TEXT,
    size           INTEGER DEFAULT 0,
    engagement_avg NUMERIC(5,2) DEFAULT 0,
    turnover_rate  NUMERIC(5,2) DEFAULT 0,
    performance    TEXT DEFAULT 'medium',
    at_risk_count  INTEGER DEFAULT 0,
    created_at     TIMESTAMPTZ DEFAULT NOW()
  )`,
  // Employees
  `CREATE TABLE IF NOT EXISTS public.employees (
    id               SERIAL PRIMARY KEY,
    name             TEXT NOT NULL,
    email            TEXT UNIQUE,
    position         TEXT,
    department       TEXT,
    team             TEXT,
    tenure           INTEGER DEFAULT 0,
    engagement_score INTEGER DEFAULT 0,
    turnover_risk    TEXT DEFAULT 'low',
    performance      TEXT DEFAULT 'medium',
    turnover_cost    NUMERIC(12,2) DEFAULT 0,
    join_date        DATE,
    last_survey      DATE,
    career_progress  INTEGER DEFAULT 0,
    skills_score     INTEGER DEFAULT 0,
    avatar           TEXT,
    active           BOOLEAN DEFAULT TRUE,
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW()
  )`,
  // Engagement history
  `CREATE TABLE IF NOT EXISTS public.engagement_history (
    id         SERIAL PRIMARY KEY,
    month      TEXT NOT NULL,
    year       INTEGER NOT NULL,
    value      NUMERIC(5,2),
    target     NUMERIC(5,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,
  // Turnover history
  `CREATE TABLE IF NOT EXISTS public.turnover_history (
    id         SERIAL PRIMARY KEY,
    month      TEXT NOT NULL,
    year       INTEGER NOT NULL,
    rate       NUMERIC(5,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,
  // Alerts
  `CREATE TABLE IF NOT EXISTS public.alerts (
    id         SERIAL PRIMARY KEY,
    type       TEXT DEFAULT 'info',
    title      TEXT NOT NULL,
    message    TEXT,
    timestamp  TEXT DEFAULT 'agora',
    read       BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,
  // Company settings
  `CREATE TABLE IF NOT EXISTS public.company_settings (
    id                      SERIAL PRIMARY KEY,
    company_name            TEXT DEFAULT 'Minha Empresa',
    sector                  TEXT,
    country                 TEXT DEFAULT 'Brasil',
    min_engagement_goal     NUMERIC(5,2) DEFAULT 75,
    max_turnover_goal       NUMERIC(5,2) DEFAULT 10,
    min_nps_goal            NUMERIC(4,2) DEFAULT 7.5,
    survey_frequency        TEXT DEFAULT 'monthly',
    survey_language         TEXT DEFAULT 'pt-br',
    notif_turnover_realtime BOOLEAN DEFAULT TRUE,
    notif_monthly_report    BOOLEAN DEFAULT TRUE,
    notif_weekly_summary    BOOLEAN DEFAULT FALSE,
    notif_low_engagement    BOOLEAN DEFAULT TRUE,
    notif_survey_responses  BOOLEAN DEFAULT FALSE,
    updated_at              TIMESTAMPTZ DEFAULT NOW()
  )`,
  // RLS - enable
  `ALTER TABLE public.departments       ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE public.teams             ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE public.employees         ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE public.engagement_history ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE public.turnover_history  ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE public.alerts            ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE public.company_settings  ENABLE ROW LEVEL SECURITY`,
  // RLS - policies (DROP first to avoid conflicts on re-run)
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='departments' AND policyname='anon_read_departments') THEN
      CREATE POLICY anon_read_departments ON public.departments FOR SELECT USING (true);
    END IF;
  END $$`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='teams' AND policyname='anon_read_teams') THEN
      CREATE POLICY anon_read_teams ON public.teams FOR SELECT USING (true);
    END IF;
  END $$`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='employees' AND policyname='anon_read_employees') THEN
      CREATE POLICY anon_read_employees ON public.employees FOR SELECT USING (true);
    END IF;
  END $$`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='engagement_history' AND policyname='anon_read_engagement_history') THEN
      CREATE POLICY anon_read_engagement_history ON public.engagement_history FOR SELECT USING (true);
    END IF;
  END $$`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='turnover_history' AND policyname='anon_read_turnover_history') THEN
      CREATE POLICY anon_read_turnover_history ON public.turnover_history FOR SELECT USING (true);
    END IF;
  END $$`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='alerts' AND policyname='anon_read_alerts') THEN
      CREATE POLICY anon_read_alerts ON public.alerts FOR SELECT USING (true);
    END IF;
  END $$`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='company_settings' AND policyname='anon_read_company_settings') THEN
      CREATE POLICY anon_read_company_settings ON public.company_settings FOR SELECT USING (true);
    END IF;
  END $$`,
  // Updated_at trigger
  `CREATE OR REPLACE FUNCTION public.set_updated_at()
   RETURNS TRIGGER LANGUAGE plpgsql AS $$
   BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='employees_updated_at') THEN
      CREATE TRIGGER employees_updated_at
        BEFORE UPDATE ON public.employees
        FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
    END IF;
  END $$`,
  // Seed departments
  `INSERT INTO public.departments (name, color) VALUES
    ('Tecnologia','#2563EB'),('Produto','#10B981'),('Comercial','#F59E0B'),
    ('RH','#8B5CF6'),('Marketing','#EC4899'),('Financeiro','#06B6D4')
   ON CONFLICT (name) DO NOTHING`,
  // Seed teams
  `INSERT INTO public.teams (name, department, lead, size, engagement_avg, turnover_rate, performance, at_risk_count)
   SELECT * FROM (VALUES
    ('Squad Alpha','Tecnologia','João Silva',8,89.0,8.5,'star',0),
    ('Data & Analytics','Tecnologia','Carlos Mendes',5,62.0,24.0,'medium',2),
    ('Design System','Produto','Ana Oliveira',6,93.0,4.2,'star',0),
    ('Sales Enterprise','Comercial','Rafael Costa',12,76.0,15.3,'high',1),
    ('People & Culture','RH','Maria Santos',4,84.0,10.0,'high',0),
    ('Finance','Financeiro','Lucas Rocha',7,80.0,7.5,'high',0),
    ('Growth','Marketing','Patricia Souza',9,88.0,6.8,'star',0),
    ('Squad Beta','Tecnologia','Fernanda Lima',7,58.0,28.6,'low',3)
   ) AS v(name,department,lead,size,engagement_avg,turnover_rate,performance,at_risk_count)
   WHERE NOT EXISTS (SELECT 1 FROM public.teams LIMIT 1)`,
  // Seed employees
  `INSERT INTO public.employees (name,email,position,department,team,tenure,engagement_score,turnover_risk,performance,turnover_cost,join_date,last_survey,career_progress,skills_score)
   SELECT * FROM (VALUES
    ('João Silva','joao.silva@empresa.com','Desenvolvedor Sênior','Tecnologia','Squad Alpha',24,92,'low','star',0::numeric,'2022-03-15'::date,'2024-01-10'::date,78,88),
    ('Maria Santos','maria.santos@empresa.com','HR Manager','RH','People & Culture',36,88,'medium','high',45000::numeric,'2021-01-20'::date,'2024-01-08'::date,65,82),
    ('Carlos Mendes','carlos.mendes@empresa.com','Analista de Dados','Tecnologia','Data & Analytics',8,61,'high','medium',32000::numeric,'2023-05-10'::date,'2024-01-05'::date,32,64),
    ('Ana Oliveira','ana.oliveira@empresa.com','Product Designer','Produto','Design System',18,95,'low','star',0::numeric,'2022-07-01'::date,'2024-01-11'::date,82,91),
    ('Rafael Costa','rafael.costa@empresa.com','Gerente de Vendas','Comercial','Sales Enterprise',14,74,'medium','high',28000::numeric,'2022-11-15'::date,'2024-01-07'::date,55,72),
    ('Fernanda Lima','fernanda.lima@empresa.com','Engenheira de Software','Tecnologia','Squad Beta',6,55,'high','medium',38000::numeric,'2023-07-20'::date,'2023-12-28'::date,28,59),
    ('Lucas Rocha','lucas.rocha@empresa.com','Analista Financeiro','Financeiro','Finance',48,82,'low','high',0::numeric,'2020-02-10'::date,'2024-01-09'::date,70,79),
    ('Patricia Souza','patricia.souza@empresa.com','Marketing Lead','Marketing','Growth',22,90,'low','star',0::numeric,'2022-04-05'::date,'2024-01-10'::date,75,85)
   ) AS v(name,email,position,department,team,tenure,engagement_score,turnover_risk,performance,turnover_cost,join_date,last_survey,career_progress,skills_score)
   WHERE NOT EXISTS (SELECT 1 FROM public.employees LIMIT 1)`,
  // Seed engagement history
  `INSERT INTO public.engagement_history (month,year,value,target)
   SELECT * FROM (VALUES
    ('Ago',2023,78.0,72.0),('Set',2023,81.0,74.0),('Out',2023,79.0,71.0),
    ('Nov',2023,84.0,76.0),('Dez',2023,88.0,80.0),('Jan',2024,91.0,83.0)
   ) AS v(month,year,value,target)
   WHERE NOT EXISTS (SELECT 1 FROM public.engagement_history LIMIT 1)`,
  // Seed turnover history
  `INSERT INTO public.turnover_history (month,year,rate)
   SELECT * FROM (VALUES
    ('Ago',2023,16.2),('Set',2023,15.8),('Out',2023,14.5),
    ('Nov',2023,13.9),('Dez',2023,13.2),('Jan',2024,12.8)
   ) AS v(month,year,rate)
   WHERE NOT EXISTS (SELECT 1 FROM public.turnover_history LIMIT 1)`,
  // Seed alerts
  `INSERT INTO public.alerts (type,title,message,timestamp,read)
   SELECT * FROM (VALUES
    ('danger','3 funcionários em alto risco','Carlos Mendes, Fernanda Lima e mais 1 apresentam sinais de turnover iminente.','há 2h',false),
    ('warning','Squad Beta com engajamento crítico','O engajamento do Squad Beta caiu 8 pontos no último mês (58%).','há 5h',false),
    ('info','Pesquisa de engajamento em aberto','47 funcionários ainda não responderam à pesquisa de Janeiro.','há 1d',true),
    ('success','Meta de turnover superada','O departamento de Produto atingiu taxa de turnover de 4.2% (meta: 8%).','há 2d',true)
   ) AS v(type,title,message,timestamp,read)
   WHERE NOT EXISTS (SELECT 1 FROM public.alerts LIMIT 1)`,
  // Seed company settings
  `INSERT INTO public.company_settings (company_name,sector,country)
   SELECT 'TechCorp Brasil','Tecnologia','Brasil'
   WHERE NOT EXISTS (SELECT 1 FROM public.company_settings LIMIT 1)`,
];

async function runSQL(sql: string, serviceRoleKey: string): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(`${KIPLE_URL}/rest/v1/rpc/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceRoleKey,
      'Authorization': `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify({ query: sql }),
  });
  // Try the pg REST SQL endpoint
  const sqlRes = await fetch(`${KIPLE_URL}/rest/v1/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceRoleKey,
      'Authorization': `Bearer ${serviceRoleKey}`,
      'Prefer': 'tx=commit',
    },
    body: sql,
  });
  return { ok: true };
}

async function runSQLViaPg(sql: string, serviceRoleKey: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${KIPLE_URL}/rest/v1/`, {
      method: 'HEAD',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
    });
    // Use the SQL over HTTP endpoint
    const sqlEndpoint = `${KIPLE_URL}/pg/query`;
    const r = await fetch(sqlEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ query: sql }),
    });
    if (!r.ok) {
      const body = await r.text();
      return { ok: false, error: body };
    }
    await r.text();
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const serviceRoleKey = Deno.env.get('KIPLE_SERVICE_ROLE_KEY');
  if (!serviceRoleKey) {
    return new Response(JSON.stringify({ error: 'KIPLE_SERVICE_ROLE_KEY not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const results: { sql: string; ok: boolean; error?: string }[] = [];

    for (const sql of SETUP_SQL_STATEMENTS) {
      // Use Supabase's SQL-over-HTTP (pg endpoint)
      const res = await fetch(`${KIPLE_URL}/pg/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({ query: sql }),
      });

      const preview = sql.trim().slice(0, 60).replace(/\s+/g, ' ');

      if (!res.ok) {
        const body = await res.text();
        // Ignore "already exists" type errors — safe to continue
        if (body.includes('already exists') || body.includes('duplicate') || body.includes('42P07')) {
          results.push({ sql: preview, ok: true });
        } else {
          results.push({ sql: preview, ok: false, error: body.slice(0, 200) });
        }
      } else {
        await res.text();
        results.push({ sql: preview, ok: true });
      }
    }

    const failed = results.filter(r => !r.ok);
    const succeeded = results.filter(r => r.ok).length;

    return new Response(JSON.stringify({
      success: failed.length === 0,
      succeeded,
      failed: failed.length,
      details: failed.length > 0 ? failed : undefined,
      message: failed.length === 0
        ? `✅ Todas as ${succeeded} operações executadas com sucesso!`
        : `⚠️ ${succeeded} ok, ${failed.length} com erro. Veja detalhes.`,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
