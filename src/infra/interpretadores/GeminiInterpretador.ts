import {
  ApiError,
  type GenerateContentResponse,
  GoogleGenAI,
  type Part,
} from '@google/genai';
import { z } from 'zod';
import { Formato } from '../../models/Formato';
import { MensagemDoPeriodo } from '../../models/MensagemDoPeriodo';
import { Registro } from '../../models/Registro';
import { IInterpretador } from '../../services/IInterpretador';

export class GeminiInterpretador implements IInterpretador {
  private cliente: GoogleGenAI;

  public constructor(
    chave: string,
    private modelosEmOrdemDePreferencia: string[],
    private instrucoes: string,
  ) {
    this.cliente = new GoogleGenAI({
      apiKey: chave,
      httpOptions: { retryOptions: { attempts: 3 } },
    });
  }

  public async interpretar(
    formato: Formato,
    mensagens: MensagemDoPeriodo[],
  ): Promise<Registro[]> {
    const idsDasSecoes = formato.secoes.map(secao => secao.id);
    const esquema = z.object({
      registros: z.array(
        z.object({
          data: z.string().describe('AAAA-MM-DD'),
          secao: z.enum(idsDasSecoes as [string, ...string[]]),
          texto: z.string(),
          fotos: z.array(
            z.object({ arquivo: z.string(), legenda: z.string() }),
          ),
        }),
      ),
    });

    const listaDeSecoes = formato.secoes
      .map(secao => `- ${secao.id}: ${secao.titulo}. ${secao.descricao}`)
      .join('\n');
    const partes: Part[] = [
      { text: `Secoes:\n${listaDeSecoes}\n\nMensagens do periodo, em ordem:` },
    ];

    for (const mensagem of mensagens) {
      const quando = `[${mensagem.data} ${mensagem.hora}]`;
      if (mensagem.texto) {
        partes.push({ text: `${quando} texto: ${mensagem.texto}` });
      }
      if (mensagem.audioTranscrito) {
        partes.push({
          text: `${quando} audio transcrito: ${mensagem.audioTranscrito}`,
        });
      }
      if (mensagem.foto) {
        const legenda = mensagem.foto.legenda
          ? `, legenda: ${mensagem.foto.legenda}`
          : '';
        partes.push({
          text: `${quando} foto ${mensagem.foto.arquivo}${legenda}`,
        });
        partes.push({
          inlineData: {
            mimeType: mensagem.foto.midia.mimeType,
            data: Buffer.from(mensagem.foto.midia.conteudo).toString('base64'),
          },
        });
      }
    }

    let resposta: GenerateContentResponse | undefined;
    for (const modelo of this.modelosEmOrdemDePreferencia) {
      try {
        resposta = await this.cliente.models.generateContent({
          model: modelo,
          contents: [{ role: 'user', parts: partes }],
          config: {
            systemInstruction: this.instrucoes,
            responseMimeType: 'application/json',
            responseJsonSchema: z.toJSONSchema(esquema),
          },
        });
        break;
      } catch (erro) {
        const modeloSobrecarregado =
          erro instanceof ApiError &&
          (erro.status === 503 || erro.status === 429);
        if (!modeloSobrecarregado) {
          throw erro;
        }
        console.error(`${modelo} sobrecarregado, tentando o proximo modelo`);
      }
    }

    if (!resposta) {
      throw new Error('Todos os modelos do Gemini estao sobrecarregados');
    }
    if (!resposta.text) {
      throw new Error(
        `O Gemini nao devolveu os registros (motivo: ${resposta.candidates?.[0]?.finishReason})`,
      );
    }
    const interpretacao = esquema.parse(JSON.parse(resposta.text));

    const fotosEnviadas = new Set(
      mensagens.flatMap(mensagem =>
        mensagem.foto ? [mensagem.foto.arquivo] : [],
      ),
    );
    const registros: Registro[] = interpretacao.registros.map(registro => ({
      ...registro,
      fotos: registro.fotos.filter(foto => fotosEnviadas.has(foto.arquivo)),
    }));
    return registros;
  }
}
