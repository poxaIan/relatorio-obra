import { Midia } from '../models/Midia';
import { NotificacaoDoWhatsApp } from '../models/NotificacaoDoWhatsApp';
import { GerarRelatorioService } from './GerarRelatorioService';
import { IMensagemStore } from './IMensagemStore';
import { ITranscritor } from './ITranscritor';
import { IWhatsAppClient } from './IWhatsAppClient';

const HORA = new Intl.DateTimeFormat('pt-BR', { timeStyle: 'medium' });
const DATA_LOCAL = new Intl.DateTimeFormat('en-CA');

export class ReceberMensagensService {
  public constructor(
    private mensagens: IMensagemStore,
    private whatsApp: IWhatsAppClient,
    private transcritor: ITranscritor,
    private gerarRelatorio: GerarRelatorioService,
    private palavraChave: string,
    private remetentesPermitidos: Set<string>,
  ) {}

  public async execute(notificacao: NotificacaoDoWhatsApp): Promise<void> {
    const mensagensRecebidas = notificacao.entry
      .flatMap(entrada => entrada.changes)
      .flatMap(mudanca => mudanca.value.messages ?? []);

    for (const mensagem of mensagensRecebidas) {
      const remetentePermitido = this.remetentesPermitidos.has(mensagem.from);
      if (!remetentePermitido) {
        console.log(
          `${HORA.format(new Date())} ${mensagem.from} ignorada: numero fora de REMETENTES_PERMITIDOS`,
        );
        continue;
      }

      const conteudo = mensagem.text?.body ?? mensagem.image?.caption;
      console.log(
        `${HORA.format(new Date())} ${mensagem.from} ${mensagem.type}${conteudo ? `: ${conteudo}` : ''}`,
      );

      await this.mensagens.salvar(mensagem);

      const textoSemAcento = (mensagem.text?.body ?? '')
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .trim()
        .toLowerCase();
      const pediuRelatorio = textoSemAcento === this.palavraChave;
      if (pediuRelatorio) {
        const diaDaMensagem = DATA_LOCAL.format(
          new Date(Number(mensagem.timestamp) * 1000),
        );
        void this.gerarRelatorioEmSegundoPlano(
          new Date(`${diaDaMensagem}T00:00:00Z`),
        );
      }

      const midiaDaMensagem = mensagem.image ?? mensagem.audio;
      if (midiaDaMensagem) {
        try {
          const midia = await this.whatsApp.baixarMidia(midiaDaMensagem.id);
          await this.mensagens.salvarMidia(midiaDaMensagem.id, midia);

          if (mensagem.audio) {
            void this.transcreverEmSegundoPlano(
              mensagem.from,
              midiaDaMensagem.id,
              midia,
            );
          }
        } catch (erro) {
          console.error(
            `Nao consegui baixar a midia ${midiaDaMensagem.id}: ${(erro as Error).message}`,
          );
        }
      }

      try {
        await this.whatsApp.responder(mensagem.from, mensagem.id, 'Recebido.');
      } catch (erro) {
        console.error(
          `Nao consegui confirmar a mensagem: ${(erro as Error).message}`,
        );
      }
    }
  }

  private async transcreverEmSegundoPlano(
    remetente: string,
    idDoAudio: string,
    audio: Midia,
  ): Promise<void> {
    try {
      const texto = await this.transcritor.transcrever(audio);
      await this.mensagens.salvarTranscricao(idDoAudio, texto);
      console.log(
        `${HORA.format(new Date())} ${remetente} audio transcrito: ${texto}`,
      );
    } catch (erro) {
      console.error(
        `Nao consegui transcrever o audio ${idDoAudio}: ${(erro as Error).message}`,
      );
    }
  }

  private async gerarRelatorioEmSegundoPlano(referencia: Date): Promise<void> {
    console.log(`${HORA.format(new Date())} gerando relatorio...`);
    try {
      const caminho = await this.gerarRelatorio.execute(referencia);
      console.log(
        `${HORA.format(new Date())} relatorio salvo em ${caminho} e enviado por e-mail`,
      );
    } catch (erro) {
      console.error(
        `Nao consegui gerar o relatorio: ${(erro as Error).message}`,
      );
    }
  }
}
