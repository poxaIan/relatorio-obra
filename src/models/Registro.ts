export interface Foto {
  arquivo: string;
  legenda: string;
}

export interface Registro {
  data: string;
  secao: string;
  texto: string;
  fotos: Foto[];
}
