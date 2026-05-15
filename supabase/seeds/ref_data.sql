-- Reference / master data required by seed_rh_massivo.sql
-- Safe to re-run: ON CONFLICT DO NOTHING on all inserts.

BEGIN;

-- ------------------------------------------------------------------ departments
INSERT INTO public.departamentos (nome)
VALUES
  ('Operações'),
  ('Comercial'),
  ('Financeiro'),
  ('Recursos Humanos'),
  ('Administrativo'),
  ('Jurídico'),
  ('Diretoria Geral')
ON CONFLICT (nome) DO NOTHING;

-- ------------------------------------------------------------------ motivos_desligamento
INSERT INTO public.motivos_desligamento (nome, descricao, status)
VALUES
  -- voluntary
  ('Benefícios abaixo do mercado',                    'Insatisfação com o pacote de benefícios oferecido',                      'ativo'),
  ('Salário abaixo do mercado',                        'Remuneração inferior à média do mercado',                                 'ativo'),
  ('Falta de oportunidades de crescimento',            'Ausência de plano de carreira ou promoções',                             'ativo'),
  ('Busca por melhor qualidade de vida',               'Desejo de equilíbrio entre vida pessoal e profissional',                  'ativo'),
  ('Proposta melhor de outra empresa',                 'Oferta mais atrativa de outro empregador',                               'ativo'),
  ('Desalinhamento com valores ou cultura da empresa', 'Divergência entre os valores pessoais e os da organização',              'ativo'),
  ('Liderança ruim ou conflitos com gestores',         'Problemas de relacionamento com a liderança direta',                     'ativo'),
  -- involuntary
  ('Baixo desempenho',                                 'Resultados consistentemente abaixo do esperado',                         'ativo'),
  ('Falta de comprometimento',                         'Ausência de engajamento e responsabilidade',                             'ativo'),
  ('Comportamento inadequado',                         'Condutas incompatíveis com as normas da empresa',                        'ativo'),
  ('Insubordinação',                                   'Recusa em cumprir ordens ou diretrizes legítimas',                       'ativo'),
  ('Reestruturação da empresa',                        'Reorganização interna que eliminou o cargo',                             'ativo'),
  ('Problemas disciplinares',                          'Infrações repetidas ao código de conduta',                               'ativo'),
  ('Falta de habilidades necessárias para o cargo',   'Perfil técnico incompatível com as exigências da função',                'ativo'),
  ('Baixa adaptação à cultura da empresa',             'Dificuldade de integração ao ambiente organizacional',                   'ativo'),
  ('Uso inadequado de recursos da empresa',            'Utilização indevida de ativos ou sistemas corporativos',                 'ativo'),
  ('Problemas financeiros da empresa',                 'Desligamento motivado por restrições orçamentárias',                     'ativo')
ON CONFLICT (nome) DO NOTHING;

COMMIT;
