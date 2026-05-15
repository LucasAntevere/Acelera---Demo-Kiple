-- Add data_nascimento and cargo, backfill from idade, then remove idade
ALTER TABLE public.funcionarios
  ADD COLUMN IF NOT EXISTS data_nascimento DATE,
  ADD COLUMN IF NOT EXISTS cargo TEXT;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name   = 'funcionarios'
      AND column_name  = 'idade'
  ) THEN
    UPDATE public.funcionarios
    SET data_nascimento = COALESCE(data_nascimento, (CURRENT_DATE - make_interval(years => COALESCE(idade, 30)))::date)
    WHERE data_nascimento IS NULL;
  END IF;
END $$;

UPDATE public.funcionarios
SET cargo = COALESCE(NULLIF(cargo, ''), 'Nao informado')
WHERE cargo IS NULL OR cargo = '';

ALTER TABLE public.funcionarios
  ALTER COLUMN data_nascimento SET NOT NULL,
  ALTER COLUMN cargo SET NOT NULL;

ALTER TABLE public.funcionarios
  DROP COLUMN IF EXISTS idade;
