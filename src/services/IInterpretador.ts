import { Formato } from '../models/Formato';
import { MensagemDoPeriodo } from '../models/MensagemDoPeriodo';
import { Registro } from '../models/Registro';

export interface IInterpretador {
  interpretar(
    formato: Formato,
    mensagens: MensagemDoPeriodo[],
  ): Promise<Registro[]>;
}
