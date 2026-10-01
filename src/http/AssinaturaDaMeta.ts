import { createHmac, timingSafeEqual } from 'node:crypto';
import { preHandlerHookHandler } from 'fastify';

export function exigirAssinaturaDaMeta(
  appSecret: string,
): preHandlerHookHandler {
  const filtro: preHandlerHookHandler = async (requisicao, resposta) => {
    const assinaturaRecebida = String(
      requisicao.headers['x-hub-signature-256'] ?? '',
    );
    const hmacDoCorpo = createHmac('sha256', appSecret)
      .update(requisicao.body as Buffer)
      .digest('hex');
    const assinaturaEsperada = `sha256=${hmacDoCorpo}`;
    const mesmoTamanho =
      assinaturaRecebida.length === assinaturaEsperada.length;
    const assinaturaValida =
      mesmoTamanho &&
      timingSafeEqual(
        Buffer.from(assinaturaRecebida),
        Buffer.from(assinaturaEsperada),
      );

    if (!assinaturaValida) {
      resposta.code(401).send();
      return resposta;
    }
  };
  return filtro;
}
