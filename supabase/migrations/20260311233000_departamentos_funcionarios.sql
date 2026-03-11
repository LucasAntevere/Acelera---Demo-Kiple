-- Add departamentos domain and link to funcionarios

CREATE TABLE IF NOT EXISTS public.departamentos (
  id BIGSERIAL PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  data_criacao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_atualizacao TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.funcionarios
  ADD COLUMN IF NOT EXISTS departamento_id BIGINT NULL;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'funcionarios_departamento_id_fkey'
  ) THEN
    ALTER TABLE public.funcionarios
      ADD CONSTRAINT funcionarios_departamento_id_fkey
      FOREIGN KEY (departamento_id)
      REFERENCES public.departamentos(id)
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_funcionarios_departamento_id ON public.funcionarios(departamento_id);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='departamentos_set_data_atualizacao') THEN
    CREATE TRIGGER departamentos_set_data_atualizacao
    BEFORE UPDATE ON public.departamentos
    FOR EACH ROW EXECUTE FUNCTION public.set_data_atualizacao();
  END IF;
END $$;

ALTER TABLE public.departamentos ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='departamentos' AND policyname='auth_all_departamentos') THEN
    CREATE POLICY auth_all_departamentos ON public.departamentos FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

INSERT INTO public.departamentos (nome)
SELECT * FROM (VALUES
  ('Recursos Humanos'),
  ('Financeiro'),
  ('Operacoes')
) AS v(nome)
ON CONFLICT (nome) DO NOTHING;
