import { FastifyReply, FastifyRequest } from 'fastify';
import { ReceberMensagensService } from '../services/ReceberMensagensService';

interface VerificacaoDaMeta {
  'hub.mode'?: string;
  'hub.verify_token'?: string;
  'hub.challenge'?: string;
}

export class WebhookHandlers {
  public constructor(
    private receberMensagens: ReceberMensagensService,
    private verifyToken: string,
  ) {}

  public verificar = async (
    requisicao: FastifyRequest<{ Querystring: VerificacaoDaMeta }>,
    resposta: FastifyReply,
  ) => {
    const query = requisicao.query;
    const tokenConfere =
      query['hub.mode'] === 'subscribe' &&
      query['hub.verify_token'] === this.verifyToken;

    if (!tokenConfere) {
      resposta.code(403).send();
      return resposta;
    }

    resposta.send(query['hub.challenge']);
    return resposta;
  };

  public receber = async (
    requisicao: FastifyRequest,
    resposta: FastifyReply,
  ) => {
    const notificacao = JSON.parse(
      (requisicao.body as Buffer).toString('utf8'),
    );
    await this.receberMensagens.execute(notificacao);
    resposta.code(200).send();
    return resposta;
  };
}
