BEGIN;

DO $$
DECLARE
  v_marker CONSTANT text := 'seed_rh_2026_v1';
  v_prefix CONSTANT text := '[SEED_RH_2026]%';

  v_dep_operacoes bigint;
  v_dep_comercial bigint;
  v_dep_financeiro bigint;
  v_dep_rh bigint;
  v_dep_administrativo bigint;
  v_dep_juridico bigint;
  v_dep_diretoria bigint;

  v_motivo_beneficios bigint;
  v_motivo_salario bigint;
  v_motivo_crescimento bigint;
  v_motivo_qualidade bigint;

  v_vol_ids bigint[];
  v_inv_ids bigint[];

  v_start_10y date := (CURRENT_DATE - interval '10 years')::date;
  v_start_month date := date_trunc('month', CURRENT_DATE - interval '10 years')::date;
  v_curr_month date := date_trunc('month', CURRENT_DATE)::date;

  v_month date;
  v_days integer;
  v_vol integer;
  v_inv integer;
  v_total integer;
  v_seed_func integer;
  v_seed_unique integer;
BEGIN
  SELECT id INTO v_dep_operacoes FROM public.departamentos WHERE lower(nome) IN ('operacoes','operações') LIMIT 1;
  SELECT id INTO v_dep_comercial FROM public.departamentos WHERE lower(nome) = 'comercial' LIMIT 1;
  SELECT id INTO v_dep_financeiro FROM public.departamentos WHERE lower(nome) = 'financeiro' LIMIT 1;
  SELECT id INTO v_dep_rh FROM public.departamentos WHERE lower(nome) = 'recursos humanos' LIMIT 1;
  SELECT id INTO v_dep_administrativo FROM public.departamentos WHERE lower(nome) = 'administrativo' LIMIT 1;
  SELECT id INTO v_dep_juridico FROM public.departamentos WHERE lower(nome) IN ('juridico','jurídico') LIMIT 1;
  SELECT id INTO v_dep_diretoria FROM public.departamentos WHERE lower(nome) = 'diretoria geral' LIMIT 1;

  IF v_dep_operacoes IS NULL OR v_dep_comercial IS NULL OR v_dep_financeiro IS NULL
    OR v_dep_rh IS NULL OR v_dep_administrativo IS NULL OR v_dep_juridico IS NULL OR v_dep_diretoria IS NULL THEN
    RAISE EXCEPTION 'Departamentos obrigatórios não encontrados.';
  END IF;

  SELECT id INTO v_motivo_beneficios FROM public.motivos_desligamento WHERE lower(nome) IN ('benefícios abaixo do mercado','beneficios abaixo do mercado') AND status='ativo' LIMIT 1;
  SELECT id INTO v_motivo_salario FROM public.motivos_desligamento WHERE lower(nome) IN ('salário abaixo do mercado','salario abaixo do mercado') AND status='ativo' LIMIT 1;
  SELECT id INTO v_motivo_crescimento FROM public.motivos_desligamento WHERE lower(nome) = 'falta de oportunidades de crescimento' AND status='ativo' LIMIT 1;
  SELECT id INTO v_motivo_qualidade FROM public.motivos_desligamento WHERE lower(nome) = 'busca por melhor qualidade de vida' AND status='ativo' LIMIT 1;

  IF v_motivo_beneficios IS NULL OR v_motivo_salario IS NULL OR v_motivo_crescimento IS NULL THEN
    RAISE EXCEPTION 'Motivos de desligamento essenciais não encontrados.';
  END IF;

  SELECT array_agg(id ORDER BY id) INTO v_vol_ids
  FROM public.motivos_desligamento
  WHERE status='ativo' AND id IN (
    v_motivo_beneficios,
    v_motivo_salario,
    v_motivo_crescimento,
    v_motivo_qualidade,
    (SELECT id FROM public.motivos_desligamento WHERE lower(nome)='proposta melhor de outra empresa' LIMIT 1),
    (SELECT id FROM public.motivos_desligamento WHERE lower(nome)='desalinhamento com valores ou cultura da empresa' LIMIT 1),
    (SELECT id FROM public.motivos_desligamento WHERE lower(nome)='liderança ruim ou conflitos com gestores' LIMIT 1)
  );

  SELECT array_agg(id ORDER BY id) INTO v_inv_ids
  FROM public.motivos_desligamento
  WHERE status='ativo' AND lower(nome) IN (
    'baixo desempenho',
    'falta de comprometimento',
    'comportamento inadequado',
    'insubordinação',
    'reestruturação da empresa',
    'problemas disciplinares',
    'falta de habilidades necessárias para o cargo',
    'baixa adaptação à cultura da empresa',
    'uso inadequado de recursos da empresa',
    'problemas financeiros da empresa'
  );

  IF array_length(v_vol_ids,1) IS NULL OR array_length(v_inv_ids,1) IS NULL THEN
    RAISE EXCEPTION 'Não foi possível montar arrays de motivos de desligamento.';
  END IF;

  DELETE FROM public.desligamentos WHERE responsavel_registro = v_marker;
  DELETE FROM public.funcionarios WHERE endereco LIKE v_prefix;

  INSERT INTO public.funcionarios (nome, data_nascimento, cargo, departamento_id, sexo, salario, data_contratacao, endereco, status)
  WITH yearly(idx, qtd) AS (
    VALUES (1,22),(2,44),(3,66),(4,87),(5,109),(6,131),(7,153),(8,174),(9,196),(10,218)
  ),
  expanded AS (
    SELECT y.idx, gs.n
    FROM yearly y
    CROSS JOIN LATERAL generate_series(1, y.qtd) AS gs(n)
  ),
  ordered AS (
    SELECT row_number() OVER (ORDER BY idx, n) AS rn, idx
    FROM expanded
  ),
  base AS (
    SELECT
      o.rn,
      o.idx,
      CASE WHEN o.rn <= 576 THEN 'masculino'::public.funcionario_sexo
           WHEN o.rn <= 1152 THEN 'feminino'::public.funcionario_sexo
           WHEN o.rn <= 1176 THEN 'outro'::public.funcionario_sexo
           ELSE 'nao_informado'::public.funcionario_sexo END AS sexo,
      CASE WHEN o.rn <= 336 THEN 'operacoes'
           WHEN o.rn <= 600 THEN 'comercial'
           WHEN o.rn <= 768 THEN 'financeiro'
           WHEN o.rn <= 912 THEN 'rh'
           WHEN o.rn <= 1032 THEN 'administrativo'
           WHEN o.rn <= 1128 THEN 'juridico'
           ELSE 'diretoria' END AS dep_key
    FROM ordered o
  ),
  hired AS (
    SELECT
      b.*,
      ((v_start_10y + make_interval(years => b.idx - 1))::date
        + (
          abs(hashtext('hire-' || b.rn::text)) %
          (GREATEST(((LEAST((v_start_10y + make_interval(years => b.idx))::date - 1, CURRENT_DATE) - (v_start_10y + make_interval(years => b.idx - 1))::date)),0) + 1)
        )
      )::date AS data_contratacao
    FROM base b
  ),
  sequenced AS (
    SELECT
      h.*,
      CASE
        WHEN h.sexo = 'masculino' THEN 'm'
        WHEN h.sexo = 'feminino' THEN 'f'
        ELSE 'o'
      END AS grupo_nome,
      row_number() OVER (
        PARTITION BY CASE
          WHEN h.sexo = 'masculino' THEN 'm'
          WHEN h.sexo = 'feminino' THEN 'f'
          ELSE 'o'
        END
        ORDER BY h.rn
      ) AS grupo_seq
    FROM hired h
  ),
  male_first AS (
    SELECT unnest(ARRAY[
      'Pelé','Ronaldo','Ronaldinho','Zico','Romário','Rivaldo','Kaká','Neymar','Messi','Cristiano',
      'Mbappé','Zidane','Beckham','Roberto','Cafu','Thierry','Iniesta','Xavi','Modrić','Haaland',
      'Tony','Lázaro','Wagner','Selton','Mateus','Cauã','Reynaldo','Marco','Alexandre','José',
      'Tom','Leonardo','Brad','Robert','Al','Denzel','Keanu','Johnny','Will','George',
      'Albert','Isaac','Niels','Galileu','Nikola','Stephen','Carl','Richard','Charles','Santos',
      'Freddie','Elvis','Michael','David','Paul','Mick','Chico','Caetano','Gilberto','Djavan',
      'Ayrton','Lewis','Fernando','Usain','Phelps','Sócrates','Falcão','Bobby','Franz','Andrea'
    ]) AS fn
  ),
  female_first AS (
    SELECT unnest(ARRAY[
      'Marta','Formiga','Cristiane','Debinha','Ary','Megan','Alex','Mia','Taís','Fernanda',
      'Regina','Adriana','Patrícia','Marieta','Susana','Glória','Sonia','Lilia','Juliana','Bruna',
      'Meryl','Julia','Angelina','Scarlett','Natalie','Cate','Jennifer','Emma','Anne','Viola',
      'Marie','Ada','Rosalind','Katherine','Jane','Dorothy','Mayana','Nise','Bertha','Margaret',
      'Madonna','Beyoncé','Adele','Lady','Rihanna','Whitney','Aretha','Elis','Gal','Bethânia',
      'Anitta','Marisa','Shakira','Serena','Simone','Rebeca','Daiane','Nadia','Steffi','Frida',
      'Greta','Hedy','Sally','Cecilia','Lise','Hypatia','Emmy','Rita','Donna','Björk'
    ]) AS fn
  ),
  other_first AS (
    SELECT unnest(ARRAY[
      'Pabllo','Liniker','Sam','Janelle','Laverne','Jonathan','Miley','Demi','Tessa','Ezra',
      'RuPaul','Billy','Indya','Amandla','Elliot','Asia','Mika','Noah','Paris','Adore'
    ]) AS fn
  ),
  last_names AS (
    SELECT unnest(ARRAY[
      'Fenômeno','Gaúcho','Hernández','Gaulle','Cruise','DiCaprio','Washington','Reeves','Clooney','Einstein',
      'Newton','Tesla','Hawking','Sagan','Feynman','Darwin','Dumont','Mercury','Presley','Jackson',
      'Bowie','McCartney','Jagger','Buarque','Veloso','Gil','Senna','Hamilton','Schumacher','Alonso',
      'Bolt','Phelps','Montenegro','Araujo','Esteves','Pillar','Severo','Vieira','Pires','Braga',
      'Cabral','Paes','Marquezine','Streep','Roberts','Johansson','Portman','Blanchett','Lawrence','Stone',
      'Hathaway','Davis','Curie','Lovelace','Franklin','Johnson','Goodall','Hodgkin','Lutz','Hamilton',
      'Knowles','Germanotta','Fenty','Houston','Franklin','Costa','Monte','Williams','Biles','Andrade',
      'Comăneci','Graf','Arenas','Parker','Ramos','Moura','Mello','Coppola','Kubrick','Tarantino',
      'Spielberg','Nolan','Scorsese','Kurosawa','Miyazaki','Chaplin','Bergman','Fellini','Pasolini','Visconti',
      'Lispector','Amado','Assis','Rosa','Andrade','Neruda','Lorca','Pessoa','Kafka','Camus',
      'Lennon','Hendrix','Cobain','Winehouse','Mercury','Morissette','Swift','Minaj','Sawayama','Mendes'
    ]) AS ln
  ),
  male_pool AS (
    SELECT
      row_number() OVER (ORDER BY abs(hashtext(nome_base)), nome_base) AS seq,
      nome_base AS nome
    FROM (
      SELECT DISTINCT (mf.fn || ' ' || ln.ln)::text AS nome_base
      FROM male_first mf
      CROSS JOIN last_names ln
    ) s
  ),
  female_pool AS (
    SELECT
      row_number() OVER (ORDER BY abs(hashtext(nome_base)), nome_base) AS seq,
      nome_base AS nome
    FROM (
      SELECT DISTINCT (ff.fn || ' ' || ln.ln)::text AS nome_base
      FROM female_first ff
      CROSS JOIN last_names ln
    ) s
  ),
  other_pool AS (
    SELECT
      row_number() OVER (ORDER BY abs(hashtext(nome_base)), nome_base) AS seq,
      nome_base AS nome
    FROM (
      SELECT DISTINCT (ofn.fn || ' ' || ln.ln)::text AS nome_base
      FROM other_first ofn
      CROSS JOIN last_names ln
    ) s
  ),
  named AS (
    SELECT
      s.*,
      CASE
        WHEN s.grupo_nome = 'm' THEN mp.nome
        WHEN s.grupo_nome = 'f' THEN fp.nome
        ELSE op.nome
      END AS nome
    FROM sequenced s
    LEFT JOIN male_pool mp ON s.grupo_nome = 'm' AND s.grupo_seq = mp.seq
    LEFT JOIN female_pool fp ON s.grupo_nome = 'f' AND s.grupo_seq = fp.seq
    LEFT JOIN other_pool op ON s.grupo_nome = 'o' AND s.grupo_seq = op.seq
  )
  SELECT
    n.nome,
    (n.data_contratacao - make_interval(years => (18 + (abs(hashtext('age-' || n.rn::text)) % 48))) - ((abs(hashtext('dob-' || n.rn::text)) % 365) || ' days')::interval)::date,
    CASE n.dep_key
      WHEN 'operacoes' THEN (ARRAY['Analista de Operações','Coordenador de Operações','Especialista de Processos','Supervisor de Operações'])[(abs(hashtext('cg-' || n.rn::text)) % 4) + 1]
      WHEN 'comercial' THEN (ARRAY['Executivo de Vendas','Coordenador Comercial','Analista Comercial','Gerente de Contas'])[(abs(hashtext('cg-' || n.rn::text)) % 4) + 1]
      WHEN 'financeiro' THEN (ARRAY['Analista Financeiro','Controller','Especialista Fiscal','Coordenador Financeiro'])[(abs(hashtext('cg-' || n.rn::text)) % 4) + 1]
      WHEN 'rh' THEN (ARRAY['Analista de RH','Business Partner','Especialista de Benefícios','Coordenador de Pessoas'])[(abs(hashtext('cg-' || n.rn::text)) % 4) + 1]
      WHEN 'administrativo' THEN (ARRAY['Assistente Administrativo','Analista Administrativo','Coordenador Administrativo','Supervisor Administrativo'])[(abs(hashtext('cg-' || n.rn::text)) % 4) + 1]
      WHEN 'juridico' THEN (ARRAY['Analista Jurídico','Advogado','Consultor Jurídico','Coordenador Jurídico'])[(abs(hashtext('cg-' || n.rn::text)) % 4) + 1]
      ELSE (ARRAY['Diretor Executivo','Diretor de Operações','Diretor Financeiro','Chief People Officer'])[(abs(hashtext('cg-' || n.rn::text)) % 4) + 1]
    END,
    CASE n.dep_key
      WHEN 'operacoes' THEN v_dep_operacoes
      WHEN 'comercial' THEN v_dep_comercial
      WHEN 'financeiro' THEN v_dep_financeiro
      WHEN 'rh' THEN v_dep_rh
      WHEN 'administrativo' THEN v_dep_administrativo
      WHEN 'juridico' THEN v_dep_juridico
      ELSE v_dep_diretoria
    END,
    n.sexo,
    ROUND(
      CASE n.dep_key
        WHEN 'operacoes' THEN 3200 + ((abs(hashtext('sl-' || n.rn::text)) % 10000)::numeric / 9999) * 9800
        WHEN 'comercial' THEN 3000 + ((abs(hashtext('sl-' || n.rn::text)) % 10000)::numeric / 9999) * 13000
        WHEN 'financeiro' THEN 3800 + ((abs(hashtext('sl-' || n.rn::text)) % 10000)::numeric / 9999) * 14200
        WHEN 'rh' THEN 3400 + ((abs(hashtext('sl-' || n.rn::text)) % 10000)::numeric / 9999) * 11600
        WHEN 'administrativo' THEN 2600 + ((abs(hashtext('sl-' || n.rn::text)) % 10000)::numeric / 9999) * 8400
        WHEN 'juridico' THEN 5000 + ((abs(hashtext('sl-' || n.rn::text)) % 10000)::numeric / 9999) * 18000
        ELSE 12000 + ((abs(hashtext('sl-' || n.rn::text)) % 10000)::numeric / 9999) * 33000
      END, 2
    ),
    n.data_contratacao,
    '[SEED_RH_2026] Rua ' || ((abs(hashtext('addr-' || n.rn::text)) % 900) + 100) || ', Bairro ' || ((abs(hashtext('bairro-' || n.rn::text)) % 120) + 1) || ', São Paulo - SP',
    'ativo'::public.status_ativo
  FROM named n;

  FOR v_month IN SELECT generate_series(v_start_month, v_curr_month, interval '1 month')::date LOOP
    v_days := ((date_trunc('month', v_month) + interval '1 month - 1 day')::date - v_month + 1)::int;
    v_inv := floor(random() * 4)::int;

    IF v_month >= (v_curr_month - interval '24 months')::date THEN
      v_vol := 18 + floor(random() * 5)::int;
    ELSIF v_month >= (v_curr_month - interval '60 months')::date THEN
      v_vol := 4 + floor(random() * 3)::int;
    ELSE
      v_vol := 1 + floor(random() * 3)::int;
    END IF;

    v_total := v_vol + v_inv;

    IF v_total = 0 THEN
      CONTINUE;
    END IF;

    INSERT INTO public.desligamentos (
      funcionario_id, data_pedido, data_prevista_saida, data_efetiva_saida,
      motivo_desligamento_id, observacoes, responsavel_registro, tipo_desligamento
    )
    WITH eligible AS (
      SELECT f.id
      FROM public.funcionarios f
      WHERE f.endereco LIKE v_prefix
        AND f.data_contratacao < v_month
        AND NOT EXISTS (
          SELECT 1 FROM public.desligamentos d
          WHERE d.funcionario_id = f.id AND d.data_efetiva_saida IS NOT NULL
        )
      ORDER BY random()
      LIMIT v_total
    ),
    picked AS (
      SELECT id AS funcionario_id, row_number() OVER () AS rn FROM eligible
    ),
    base AS (
      SELECT
        p.funcionario_id,
        p.rn,
        CASE WHEN p.rn <= v_vol THEN 'voluntario'::public.tipo_desligamento ELSE 'involuntario'::public.tipo_desligamento END AS tipo_desligamento,
        (v_month + (abs(hashtext('pd-' || v_month::text || '-' || p.funcionario_id::text)) % v_days))::date AS data_pedido
      FROM picked p
    ),
    sched AS (
      SELECT
        b.*,
        (b.data_pedido + (7 + (abs(hashtext('pv-' || v_month::text || '-' || b.funcionario_id::text)) % 39)))::date AS data_prevista_saida
      FROM base b
    )
    SELECT
      s.funcionario_id,
      s.data_pedido,
      s.data_prevista_saida,
      GREATEST(s.data_pedido, (s.data_prevista_saida + ((abs(hashtext('ef-' || v_month::text || '-' || s.funcionario_id::text)) % 11) - 5))::date),
      CASE
        WHEN s.tipo_desligamento = 'voluntario' AND v_month >= (v_curr_month - interval '24 months')::date THEN
          CASE
            WHEN (abs(hashtext('mw-' || s.funcionario_id::text || '-' || v_month::text)) % 100) < 40 THEN v_motivo_beneficios
            WHEN (abs(hashtext('mw-' || s.funcionario_id::text || '-' || v_month::text)) % 100) < 65 THEN v_motivo_salario
            WHEN (abs(hashtext('mw-' || s.funcionario_id::text || '-' || v_month::text)) % 100) < 80 THEN v_motivo_crescimento
            ELSE v_vol_ids[(abs(hashtext('mwa-' || s.funcionario_id::text || '-' || v_month::text)) % array_length(v_vol_ids, 1)) + 1]
          END
        WHEN s.tipo_desligamento = 'voluntario' THEN
          v_vol_ids[(abs(hashtext('mv-' || s.funcionario_id::text || '-' || v_month::text)) % array_length(v_vol_ids, 1)) + 1]
        ELSE
          v_inv_ids[(abs(hashtext('mi-' || s.funcionario_id::text || '-' || v_month::text)) % array_length(v_inv_ids, 1)) + 1]
      END,
      CASE WHEN s.tipo_desligamento = 'voluntario'
        THEN 'Desligamento voluntário gerado por seed histórica.'
        ELSE 'Desligamento involuntário gerado por seed histórica.'
      END,
      v_marker,
      s.tipo_desligamento
    FROM sched s;
  END LOOP;

  UPDATE public.funcionarios f
  SET status = 'inativo'::public.status_ativo
  WHERE f.endereco LIKE v_prefix
    AND EXISTS (
      SELECT 1
      FROM public.desligamentos d
      WHERE d.funcionario_id = f.id
        AND d.responsavel_registro = v_marker
        AND d.data_efetiva_saida IS NOT NULL
    );

  UPDATE public.funcionarios f
  SET status = 'ativo'::public.status_ativo
  WHERE f.endereco LIKE v_prefix
    AND NOT EXISTS (
      SELECT 1
      FROM public.desligamentos d
      WHERE d.funcionario_id = f.id
        AND d.responsavel_registro = v_marker
        AND d.data_efetiva_saida IS NOT NULL
    );

  SELECT count(*) INTO v_seed_func FROM public.funcionarios WHERE endereco LIKE v_prefix;
  SELECT count(distinct nome) INTO v_seed_unique FROM public.funcionarios WHERE endereco LIKE v_prefix;

  IF v_seed_func <> 1200 THEN
    RAISE EXCEPTION 'Validação falhou: esperado 1200 funcionários seedados, encontrado %.', v_seed_func;
  END IF;

  IF v_seed_unique <> 1200 THEN
    RAISE EXCEPTION 'Validação falhou: nomes únicos esperados 1200, encontrado %.', v_seed_unique;
  END IF;

  RAISE NOTICE 'Seed RH concluído com sucesso: % funcionários, % nomes únicos.', v_seed_func, v_seed_unique;
END $$;

COMMIT;


