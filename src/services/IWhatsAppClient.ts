import { Midia } from '../models/Midia';

export interface IWhatsAppClient {
  responder(para: string, idDaMensagem: string, texto: string): Promise<void>;
  baixarMidia(idDaMidia: string): Promise<Midia>;
}
