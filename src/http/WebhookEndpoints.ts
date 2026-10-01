import { FastifyInstance } from 'fastify';
import { exigirAssinaturaDaMeta } from './AssinaturaDaMeta';
import { WebhookHandlers } from './WebhookHandlers';

export function mapearWebhookEndpoints(
  app: FastifyInstance,
  handlers: WebhookHandlers,
  appSecret: string,
): void {
  app.addContentTypeParser(
    'application/json',
    { parseAs: 'buffer' },
    (_requisicao, corpo, pronto) => pronto(null, corpo),
  );

  app.get('/webhook', handlers.verificar);
  app.post(
    '/webhook',
    { preHandler: exigirAssinaturaDaMeta(appSecret) },
    handlers.receber,
  );
}
