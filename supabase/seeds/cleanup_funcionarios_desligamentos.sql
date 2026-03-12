BEGIN;

DO $$
DECLARE
  v_deleted_desligamentos integer := 0;
  v_deleted_funcionarios integer := 0;
BEGIN
  DELETE FROM public.desligamentos;
  GET DIAGNOSTICS v_deleted_desligamentos = ROW_COUNT;

  DELETE FROM public.funcionarios;
  GET DIAGNOSTICS v_deleted_funcionarios = ROW_COUNT;

  RAISE NOTICE 'Limpeza concluída. Desligamentos removidos: %, Funcionários removidos: %.',
    v_deleted_desligamentos, v_deleted_funcionarios;
END $$;

COMMIT;

-- Verificação opcional:
-- SELECT count(*) AS total_funcionarios FROM public.funcionarios;
-- SELECT count(*) AS total_desligamentos FROM public.desligamentos;
