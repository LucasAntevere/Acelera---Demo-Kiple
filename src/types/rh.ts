export type StatusAtivo = "ativo" | "inativo";
export type FuncionarioSexo = "masculino" | "feminino" | "outro" | "nao_informado";
export type BeneficioTipo = "saude" | "alimentacao" | "transporte" | "financeiro" | "outro";
export type TipoDesligamento =
  | "voluntario"
  | "involuntario"
  | "acordo"
  | "aposentadoria"
  | "termino_contrato"
  | "outro";

export interface Departamento {
  id: number;
  nome: string;
  data_criacao: string;
  data_atualizacao: string;
}

export interface Funcionario {
  id: number;
  nome: string;
  data_nascimento: string | null;
  cargo: string | null;
  departamento_id: number | null;
  departamento_nome?: string | null;
  sexo: FuncionarioSexo;
  salario: number;
  data_contratacao: string;
  endereco: string;
  status: StatusAtivo;
  data_criacao: string;
  data_atualizacao: string;
}

export interface Beneficio {
  id: number;
  nome: string;
  tipo: BeneficioTipo;
  descricao: string;
  valor: number;
  status: StatusAtivo;
  data_criacao: string;
  data_atualizacao: string;
}

export interface FuncionarioBeneficio {
  id: number;
  funcionario_id: number;
  beneficio_id: number;
  data_inicio: string;
  data_fim: string | null;
  data_criacao: string;
  beneficio?: Pick<Beneficio, "id" | "nome" | "tipo" | "valor" | "status">;
}

export interface MotivoDesligamento {
  id: number;
  nome: string;
  descricao: string;
  status: StatusAtivo;
  data_criacao: string;
  data_atualizacao: string;
}

export interface Desligamento {
  id: number;
  funcionario_id: number;
  data_pedido: string;
  data_prevista_saida: string | null;
  data_efetiva_saida: string | null;
  motivo_desligamento_id: number;
  observacoes: string | null;
  responsavel_registro: string;
  tipo_desligamento: TipoDesligamento;
  data_criacao: string;
  data_atualizacao: string;
  funcionario_nome?: string;
  motivo_nome?: string;
}

export interface DashboardRhData {
  totalFuncionarios: number;
  funcionariosAtivos: number;
  funcionariosInativos: number;
  beneficiosAtivos: number;
  vinculosAtivos: number;
  desligamentosPeriodo: number;
  proximosDesligamentos: Desligamento[];
  ultimosDesligamentos: Desligamento[];
  contratacoesRecentes: Funcionario[];
}

export const STATUS_OPTIONS: StatusAtivo[] = ["ativo", "inativo"];
export const SEXO_OPTIONS: FuncionarioSexo[] = ["masculino", "feminino", "outro", "nao_informado"];
export const BENEFICIO_TIPO_OPTIONS: BeneficioTipo[] = ["saude", "alimentacao", "transporte", "financeiro", "outro"];
export const TIPO_DESLIGAMENTO_OPTIONS: TipoDesligamento[] = [
  "voluntario",
  "involuntario",
  "acordo",
  "aposentadoria",
  "termino_contrato",
  "outro",
];
