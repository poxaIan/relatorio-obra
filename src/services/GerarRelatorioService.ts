import { Formato } from '../models/Formato';
import { MensagemDoPeriodo } from '../models/MensagemDoPeriodo';
import { Registro } from '../models/Registro';
import { IEmailSender } from './IEmailSender';
import { IInterpretador } from './IInterpretador';
import { IMensagemStore } from './IMensagemStore';
import { IRelatorioRenderer } from './IRelatorioRenderer';
import { IRelatorioStore } from './IRelatorioStore';
import { ITranscritor } from './ITranscritor';
import { MontarRelatorioService } from './MontarRelatorioService';

const DATA_LOCAL = new Intl.DateTimeFormat('en-CA');
const HORA_LOCAL = new Intl.DateTimeFormat('pt-BR', { timeStyle: 'short' });

export class GerarRelatorioService {
  public constructor(
    private formato: Formato,
    private mensagens: IMensagemStore,
    private transcritor: ITranscritor,
    private interpretador: IInterpretador,
    private montarRelatorio: MontarRelatorioService,
    private renderer: IRelatorioRenderer,
    private relatorios: IRelatorioStore,
    private email: IEmailSender,
  ) {}

  public async execute(referencia: Date): Promise<string> {
    const { inicio, fim } = this.montarRelatorio.calcularPeriodo(
      this.formato,
      referencia,
    );
    const inicioIso = inicio.toISOString().slice(0, 10);
    const fimIso = fim.toISOString().slice(0, 10);

    const todasAsMensagens = await this.mensagens.listar();
    const mensagensDoPeriodo = todasAsMensagens
      .map(mensagem => ({
        mensagem,
        quando: new Date(Number(mensagem.timestamp) * 1000),
      }))
      .filter(({ quando }) => {
        const dia = DATA_LOCAL.format(quando);
        const dentroDoPeriodo = dia >= inicioIso && dia <= fimIso;
        return dentroDoPeriodo;
      })
      .sort((a, b) => a.quando.getTime() - b.quando.getTime());

    const entradas: MensagemDoPeriodo[] = [];
    for (const { mensagem, quando } of mensagensDoPeriodo) {
      const entrada: MensagemDoPeriodo = {
        data: DATA_LOCAL.format(quando),
        hora: HORA_LOCAL.format(quando),
        texto: mensagem.text?.body,
      };

      if (mensagem.audio) {
        let transcricao = await this.mensagens.lerTranscricao(
          mensagem.audio.id,
        );
        if (transcricao === undefined) {
          const { midia } = await this.mensagens.lerMidia(mensagem.audio.id);
          transcricao = await this.transcritor.transcrever(midia);
          await this.mensagens.salvarTranscricao(
            mensagem.audio.id,
            transcricao,
          );
        }
        entrada.audioTranscrito = transcricao;
      }

      if (mensagem.image) {
        const { arquivo, midia } = await this.mensagens.lerMidia(
          mensagem.image.id,
        );
        entrada.foto = { arquivo, midia, legenda: mensagem.image.caption };
      }

      entradas.push(entrada);
    }

    let registros: Registro[] = [];
    if (entradas.length > 0) {
      registros = await this.interpretador.interpretar(this.formato, entradas);
    }

    const relatorio = this.montarRelatorio.execute(
      this.formato,
      registros,
      referencia,
    );
    const docx = await this.renderer.renderizar(relatorio);

    const nomeDoArquivo = `relatorio-${inicioIso}-a-${fimIso}.docx`;
    const caminho = await this.relatorios.salvar(nomeDoArquivo, docx);
    await this.email.enviar(
      this.formato.assuntoDoEmail.replace('{mes}', relatorio.periodo.mes),
      { nome: nomeDoArquivo, conteudo: docx },
    );
    return caminho;
  }
}
