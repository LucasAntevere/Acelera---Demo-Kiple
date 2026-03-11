import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const KIPLE_URL = "https://npugwpifxpwymyecyyhe.supabase.co";

const SETUP_SQL_STATEMENTS = [
  // Enums
  `DO $$ BEGIN
      CREATE TYPE public.status_ativo AS ENUM ('ativo','inativo');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$`,
  `DO $$ BEGIN
      CREATE TYPE public.funcionario_sexo AS ENUM ('masculino','feminino','outro','nao_informado');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$`,
  `DO $$ BEGIN
      CREATE TYPE public.beneficio_tipo AS ENUM ('saude','alimentacao','transporte','financeiro','outro');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$`,
  `DO $$ BEGIN
      CREATE TYPE public.tipo_desligamento AS ENUM ('voluntario','involuntario','acordo','aposentadoria','termino_contrato','outro');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$`,

  // Tables
  `CREATE TABLE IF NOT EXISTS public.departamentos (
    id BIGSERIAL PRIMARY KEY,
    nome TEXT NOT NULL UNIQUE,
    data_criacao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    data_atualizacao TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS public.funcionarios (
    id BIGSERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    data_nascimento DATE NOT NULL,
    cargo TEXT NOT NULL,
    departamento_id BIGINT NULL REFERENCES public.departamentos(id) ON DELETE SET NULL,
    sexo public.funcionario_sexo NOT NULL DEFAULT 'nao_informado',
    salario NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (salario >= 0),
    data_contratacao DATE NOT NULL,
    endereco TEXT NOT NULL,
    status public.status_ativo NOT NULL DEFAULT 'ativo',
    data_criacao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    data_atualizacao TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS public.beneficios (
    id BIGSERIAL PRIMARY KEY,
    nome TEXT NOT NULL UNIQUE,
    tipo public.beneficio_tipo NOT NULL,
    descricao TEXT NOT NULL,
    valor NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (valor >= 0),
    status public.status_ativo NOT NULL DEFAULT 'ativo',
    data_criacao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    data_atualizacao TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS public.funcionario_beneficios (
    id BIGSERIAL PRIMARY KEY,
    funcionario_id BIGINT NOT NULL REFERENCES public.funcionarios(id) ON DELETE CASCADE,
    beneficio_id BIGINT NOT NULL REFERENCES public.beneficios(id) ON DELETE RESTRICT,
    data_inicio DATE NOT NULL,
    data_fim DATE NULL,
    data_criacao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT funcionario_beneficios_periodo_ck CHECK (data_fim IS NULL OR data_fim >= data_inicio)
  )`,
  `CREATE TABLE IF NOT EXISTS public.motivos_desligamento (
    id BIGSERIAL PRIMARY KEY,
    nome TEXT NOT NULL UNIQUE,
    descricao TEXT NOT NULL,
    status public.status_ativo NOT NULL DEFAULT 'ativo',
    data_criacao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    data_atualizacao TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS public.desligamentos (
    id BIGSERIAL PRIMARY KEY,
    funcionario_id BIGINT NOT NULL REFERENCES public.funcionarios(id) ON DELETE RESTRICT,
    data_pedido DATE NOT NULL,
    data_prevista_saida DATE NULL,
    data_efetiva_saida DATE NULL,
    motivo_desligamento_id BIGINT NOT NULL REFERENCES public.motivos_desligamento(id) ON DELETE RESTRICT,
    observacoes TEXT NULL,
    responsavel_registro TEXT NOT NULL,
    tipo_desligamento public.tipo_desligamento NOT NULL,
    data_criacao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    data_atualizacao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT desligamentos_prevista_ck CHECK (data_prevista_saida IS NULL OR data_prevista_saida >= data_pedido),
    CONSTRAINT desligamentos_efetiva_ck CHECK (data_efetiva_saida IS NULL OR data_efetiva_saida >= data_pedido)
  )`,

  // Indexes
  `CREATE INDEX IF NOT EXISTS idx_funcionarios_departamento_id ON public.funcionarios(departamento_id)`,
  `CREATE INDEX IF NOT EXISTS idx_funcionario_beneficios_funcionario_id ON public.funcionario_beneficios(funcionario_id)`,
  `CREATE INDEX IF NOT EXISTS idx_funcionario_beneficios_beneficio_id ON public.funcionario_beneficios(beneficio_id)`,
  `CREATE INDEX IF NOT EXISTS idx_desligamentos_data_pedido ON public.desligamentos(data_pedido)`,

  // Prevent overlapping active ranges for same employee-benefit pair
  `CREATE EXTENSION IF NOT EXISTS btree_gist`,
  `DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'funcionario_beneficios_sem_sobreposicao'
      ) THEN
        ALTER TABLE public.funcionario_beneficios
        ADD CONSTRAINT funcionario_beneficios_sem_sobreposicao
        EXCLUDE USING gist (
          funcionario_id WITH =,
          beneficio_id WITH =,
          daterange(data_inicio, COALESCE(data_fim, 'infinity'::date), '[]') WITH &&
        );
      END IF;
    END $$`,

  // Updated_at trigger shared
  `CREATE OR REPLACE FUNCTION public.set_data_atualizacao()
    RETURNS TRIGGER LANGUAGE plpgsql AS $$
    BEGIN
      NEW.data_atualizacao = NOW();
      RETURN NEW;
    END;
    $$`,
  `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='departamentos_set_data_atualizacao') THEN
        CREATE TRIGGER departamentos_set_data_atualizacao
        BEFORE UPDATE ON public.departamentos
        FOR EACH ROW EXECUTE FUNCTION public.set_data_atualizacao();
      END IF;
    END $$`,
  `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='funcionarios_set_data_atualizacao') THEN
        CREATE TRIGGER funcionarios_set_data_atualizacao
        BEFORE UPDATE ON public.funcionarios
        FOR EACH ROW EXECUTE FUNCTION public.set_data_atualizacao();
      END IF;
    END $$`,
  `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='beneficios_set_data_atualizacao') THEN
        CREATE TRIGGER beneficios_set_data_atualizacao
        BEFORE UPDATE ON public.beneficios
        FOR EACH ROW EXECUTE FUNCTION public.set_data_atualizacao();
      END IF;
    END $$`,
  `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='motivos_set_data_atualizacao') THEN
        CREATE TRIGGER motivos_set_data_atualizacao
        BEFORE UPDATE ON public.motivos_desligamento
        FOR EACH ROW EXECUTE FUNCTION public.set_data_atualizacao();
      END IF;
    END $$`,
  `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='desligamentos_set_data_atualizacao') THEN
        CREATE TRIGGER desligamentos_set_data_atualizacao
        BEFORE UPDATE ON public.desligamentos
        FOR EACH ROW EXECUTE FUNCTION public.set_data_atualizacao();
      END IF;
    END $$`,

  // RLS
  `ALTER TABLE public.departamentos ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE public.funcionarios ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE public.beneficios ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE public.funcionario_beneficios ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE public.motivos_desligamento ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE public.desligamentos ENABLE ROW LEVEL SECURITY`,

  `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='departamentos' AND policyname='auth_all_departamentos') THEN
        CREATE POLICY auth_all_departamentos ON public.departamentos FOR ALL TO authenticated USING (true) WITH CHECK (true);
      END IF;
    END $$`,
  `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='funcionarios' AND policyname='auth_all_funcionarios') THEN
        CREATE POLICY auth_all_funcionarios ON public.funcionarios FOR ALL TO authenticated USING (true) WITH CHECK (true);
      END IF;
    END $$`,
  `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='beneficios' AND policyname='auth_all_beneficios') THEN
        CREATE POLICY auth_all_beneficios ON public.beneficios FOR ALL TO authenticated USING (true) WITH CHECK (true);
      END IF;
    END $$`,
  `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='funcionario_beneficios' AND policyname='auth_all_funcionario_beneficios') THEN
        CREATE POLICY auth_all_funcionario_beneficios ON public.funcionario_beneficios FOR ALL TO authenticated USING (true) WITH CHECK (true);
      END IF;
    END $$`,
  `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='motivos_desligamento' AND policyname='auth_all_motivos_desligamento') THEN
        CREATE POLICY auth_all_motivos_desligamento ON public.motivos_desligamento FOR ALL TO authenticated USING (true) WITH CHECK (true);
      END IF;
    END $$`,
  `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='desligamentos' AND policyname='auth_all_desligamentos') THEN
        CREATE POLICY auth_all_desligamentos ON public.desligamentos FOR ALL TO authenticated USING (true) WITH CHECK (true);
      END IF;
    END $$`,

  // Seed minimal data
  `INSERT INTO public.departamentos (nome)
    SELECT * FROM (VALUES
      ('Recursos Humanos'),
      ('Financeiro'),
      ('Operacoes')
    ) AS v(nome)
    WHERE NOT EXISTS (SELECT 1 FROM public.departamentos LIMIT 1)`,

  `INSERT INTO public.funcionarios (nome,data_nascimento,cargo,departamento_id,sexo,salario,data_contratacao,endereco,status)
    SELECT * FROM (VALUES
      ('Ana Souza','1995-04-12'::date,'Analista de RH',(SELECT id FROM public.departamentos WHERE nome='Recursos Humanos' LIMIT 1),'feminino',7800,'2023-05-10','Sao Paulo - SP','ativo'),
      ('Carlos Lima','1983-09-03'::date,'Gerente de Operacoes',(SELECT id FROM public.departamentos WHERE nome='Operacoes' LIMIT 1),'masculino',10500,'2021-02-20','Campinas - SP','ativo'),
      ('Julia Ramos','1990-01-25'::date,'Especialista de Beneficios',(SELECT id FROM public.departamentos WHERE nome='Recursos Humanos' LIMIT 1),'feminino',8900,'2022-08-15','Curitiba - PR','inativo')
    ) AS v(nome,data_nascimento,cargo,departamento_id,sexo,salario,data_contratacao,endereco,status)
    WHERE NOT EXISTS (SELECT 1 FROM public.funcionarios LIMIT 1)`,

  `INSERT INTO public.beneficios (nome,tipo,descricao,valor,status)
    SELECT * FROM (VALUES
      ('Plano de Saude Premium','saude','Cobertura nacional com dependentes',650,'ativo'),
      ('Vale Alimentacao','alimentacao','Cartao mensal alimentacao',800,'ativo'),
      ('Vale Transporte','transporte','Auxilio transporte urbano',320,'ativo')
    ) AS v(nome,tipo,descricao,valor,status)
    WHERE NOT EXISTS (SELECT 1 FROM public.beneficios LIMIT 1)`,

  `INSERT INTO public.motivos_desligamento (nome,descricao,status)
    SELECT * FROM (VALUES
      ('Pedido do funcionario','Solicitacao voluntaria de desligamento','ativo'),
      ('Reestruturacao','Reorganizacao interna da empresa','ativo'),
      ('Termino de contrato','Encerramento natural do contrato','ativo')
    ) AS v(nome,descricao,status)
    WHERE NOT EXISTS (SELECT 1 FROM public.motivos_desligamento LIMIT 1)`,

  `INSERT INTO public.funcionario_beneficios (funcionario_id,beneficio_id,data_inicio,data_fim)
    SELECT f.id, b.id, '2024-01-01'::date, NULL
    FROM public.funcionarios f
    JOIN public.beneficios b ON b.nome IN ('Plano de Saude Premium','Vale Alimentacao')
    WHERE f.nome = 'Ana Souza'
      AND NOT EXISTS (SELECT 1 FROM public.funcionario_beneficios LIMIT 1)`,

  `INSERT INTO public.desligamentos (funcionario_id,data_pedido,data_prevista_saida,data_efetiva_saida,motivo_desligamento_id,observacoes,responsavel_registro,tipo_desligamento)
    SELECT f.id, '2026-03-01'::date, '2026-03-20'::date, NULL, m.id, 'Em fase de transicao de conhecimento', 'RH Operacoes', 'voluntario'
    FROM public.funcionarios f
    JOIN public.motivos_desligamento m ON m.nome = 'Pedido do funcionario'
    WHERE f.nome = 'Julia Ramos'
      AND NOT EXISTS (SELECT 1 FROM public.desligamentos LIMIT 1)`,
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const serviceRoleKey = Deno.env.get("KIPLE_SERVICE_ROLE_KEY");
  if (!serviceRoleKey) {
    return new Response(JSON.stringify({ error: "KIPLE_SERVICE_ROLE_KEY not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const results: { sql: string; ok: boolean; error?: string }[] = [];

    for (const sql of SETUP_SQL_STATEMENTS) {
      const res = await fetch(`${KIPLE_URL}/pg/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({ query: sql }),
      });

      const preview = sql.trim().slice(0, 80).replace(/\s+/g, " ");

      if (!res.ok) {
        const body = await res.text();
        results.push({ sql: preview, ok: false, error: body.slice(0, 220) });
      } else {
        await res.text();
        results.push({ sql: preview, ok: true });
      }
    }

    const failed = results.filter((r) => !r.ok);
    const succeeded = results.filter((r) => r.ok).length;

    return new Response(
      JSON.stringify({
        success: failed.length === 0,
        succeeded,
        failed: failed.length,
        details: failed.length > 0 ? failed : undefined,
        message:
          failed.length === 0
            ? `Setup RH concluido com sucesso (${succeeded} operacoes).`
            : `${succeeded} operacoes ok e ${failed.length} com erro.`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
