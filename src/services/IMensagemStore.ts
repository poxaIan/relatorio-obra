import { Midia } from '../models/Midia';
import { MensagemRecebida } from '../models/NotificacaoDoWhatsApp';

export interface IMensagemStore {
  salvar(mensagem: MensagemRecebida): Promise<void>;
  salvarMidia(idDaMidia: string, midia: Midia): Promise<void>;
  salvarTranscricao(idDaMidia: string, texto: string): Promise<void>;
  listar(): Promise<MensagemRecebida[]>;
  lerMidia(idDaMidia: string): Promise<{ arquivo: string; midia: Midia }>;
  lerTranscricao(idDaMidia: string): Promise<string | undefined>;
}
