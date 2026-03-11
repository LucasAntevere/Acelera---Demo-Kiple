-- Kiple RH Operacional migration

DO $$ BEGIN
  CREATE TYPE public.status_ativo AS ENUM ('ativo','inativo');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.funcionario_sexo AS ENUM ('masculino','feminino','outro','nao_informado');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.beneficio_tipo AS ENUM ('saude','alimentacao','transporte','financeiro','outro');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.tipo_desligamento AS ENUM ('voluntario','involuntario','acordo','aposentadoria','termino_contrato','outro');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.departamentos (
  id BIGSERIAL PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  data_criacao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_atualizacao TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.funcionarios (
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
);

CREATE TABLE IF NOT EXISTS public.beneficios (
  id BIGSERIAL PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  tipo public.beneficio_tipo NOT NULL,
  descricao TEXT NOT NULL,
  valor NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (valor >= 0),
  status public.status_ativo NOT NULL DEFAULT 'ativo',
  data_criacao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_atualizacao TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.funcionario_beneficios (
  id BIGSERIAL PRIMARY KEY,
  funcionario_id BIGINT NOT NULL REFERENCES public.funcionarios(id) ON DELETE CASCADE,
  beneficio_id BIGINT NOT NULL REFERENCES public.beneficios(id) ON DELETE RESTRICT,
  data_inicio DATE NOT NULL,
  data_fim DATE NULL,
  data_criacao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT funcionario_beneficios_periodo_ck CHECK (data_fim IS NULL OR data_fim >= data_inicio)
);

CREATE TABLE IF NOT EXISTS public.motivos_desligamento (
  id BIGSERIAL PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  descricao TEXT NOT NULL,
  status public.status_ativo NOT NULL DEFAULT 'ativo',
  data_criacao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_atualizacao TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.desligamentos (
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
);

CREATE INDEX IF NOT EXISTS idx_funcionarios_departamento_id ON public.funcionarios(departamento_id);
CREATE INDEX IF NOT EXISTS idx_funcionario_beneficios_funcionario_id ON public.funcionario_beneficios(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_funcionario_beneficios_beneficio_id ON public.funcionario_beneficios(beneficio_id);
CREATE INDEX IF NOT EXISTS idx_desligamentos_data_pedido ON public.desligamentos(data_pedido);

CREATE EXTENSION IF NOT EXISTS btree_gist;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'funcionario_beneficios_sem_sobreposicao') THEN
    ALTER TABLE public.funcionario_beneficios
    ADD CONSTRAINT funcionario_beneficios_sem_sobreposicao
    EXCLUDE USING gist (
      funcionario_id WITH =,
      beneficio_id WITH =,
      daterange(data_inicio, COALESCE(data_fim, 'infinity'::date), '[]') WITH &&
    );
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.set_data_atualizacao()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.data_atualizacao = NOW();
  RETURN NEW;
END;
$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='departamentos_set_data_atualizacao') THEN
    CREATE TRIGGER departamentos_set_data_atualizacao BEFORE UPDATE ON public.departamentos FOR EACH ROW EXECUTE FUNCTION public.set_data_atualizacao();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='funcionarios_set_data_atualizacao') THEN
    CREATE TRIGGER funcionarios_set_data_atualizacao BEFORE UPDATE ON public.funcionarios FOR EACH ROW EXECUTE FUNCTION public.set_data_atualizacao();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='beneficios_set_data_atualizacao') THEN
    CREATE TRIGGER beneficios_set_data_atualizacao BEFORE UPDATE ON public.beneficios FOR EACH ROW EXECUTE FUNCTION public.set_data_atualizacao();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='motivos_set_data_atualizacao') THEN
    CREATE TRIGGER motivos_set_data_atualizacao BEFORE UPDATE ON public.motivos_desligamento FOR EACH ROW EXECUTE FUNCTION public.set_data_atualizacao();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='desligamentos_set_data_atualizacao') THEN
    CREATE TRIGGER desligamentos_set_data_atualizacao BEFORE UPDATE ON public.desligamentos FOR EACH ROW EXECUTE FUNCTION public.set_data_atualizacao();
  END IF;
END $$;

ALTER TABLE public.departamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beneficios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funcionario_beneficios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.motivos_desligamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.desligamentos ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='departamentos' AND policyname='auth_all_departamentos') THEN
    CREATE POLICY auth_all_departamentos ON public.departamentos FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='funcionarios' AND policyname='auth_all_funcionarios') THEN
    CREATE POLICY auth_all_funcionarios ON public.funcionarios FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='beneficios' AND policyname='auth_all_beneficios') THEN
    CREATE POLICY auth_all_beneficios ON public.beneficios FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='funcionario_beneficios' AND policyname='auth_all_funcionario_beneficios') THEN
    CREATE POLICY auth_all_funcionario_beneficios ON public.funcionario_beneficios FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='motivos_desligamento' AND policyname='auth_all_motivos_desligamento') THEN
    CREATE POLICY auth_all_motivos_desligamento ON public.motivos_desligamento FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='desligamentos' AND policyname='auth_all_desligamentos') THEN
    CREATE POLICY auth_all_desligamentos ON public.desligamentos FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- old analytical tables can be dropped in a dedicated follow-up migration after production cutover
