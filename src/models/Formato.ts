export interface SecaoDoFormato {
  id: string;
  titulo: string;
  descricao: string;
  porSemana?: boolean;
}

export interface Formato {
  periodo: 'mensal' | 'semanal';
  palavraChave: string;
  assuntoDoEmail: string;
  secoes: SecaoDoFormato[];
}
