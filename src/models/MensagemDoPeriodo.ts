import { Midia } from './Midia';

export interface MensagemDoPeriodo {
  data: string;
  hora: string;
  texto?: string;
  audioTranscrito?: string;
  foto?: {
    arquivo: string;
    midia: Midia;
    legenda?: string;
  };
}
