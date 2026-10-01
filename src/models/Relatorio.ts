export interface FotoNumerada {
  numero: number;
  arquivo: string;
  legenda: string;
}

export interface RegistroDoRelatorio {
  texto: string;
  fotos: FotoNumerada[];
}

export interface Semana {
  numero: string;
  inicio: string;
  fim: string;
}

export interface Grupo {
  semana?: Semana;
  registros: RegistroDoRelatorio[];
}

export interface SecaoDoRelatorio {
  numero: number;
  titulo: string;
  vazia: boolean;
  grupos: Grupo[];
}

export interface Relatorio {
  periodo: {
    mes: string;
    inicio: string;
    fim: string;
  };
  secoes: SecaoDoRelatorio[];
}
