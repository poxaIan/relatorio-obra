import { readFile } from 'node:fs/promises';
import Fastify from 'fastify';
import { parse } from 'yaml';
import { mapearWebhookEndpoints } from './http/WebhookEndpoints';
import { WebhookHandlers } from './http/WebhookHandlers';
import { GmailEmailSender } from './infra/email/GmailEmailSender';
import { GeminiInterpretador } from './infra/interpretadores/GeminiInterpretador';
import { DocxRelatorioRenderer } from './infra/renderers/DocxRelatorioRenderer';
import { ArquivoMensagemStore } from './infra/stores/ArquivoMensagemStore';
import { ArquivoRelatorioStore } from './infra/stores/ArquivoRelatorioStore';
import { WhisperTranscritor } from './infra/transcritores/WhisperTranscritor';
import { GraphWhatsAppClient } from './infra/whatsapp/GraphWhatsAppClient';
import { Formato } from './models/Formato';
import { GerarRelatorioService } from './services/GerarRelatorioService';
import { MontarRelatorioService } from './services/MontarRelatorioService';
import { ReceberMensagensService } from './services/ReceberMensagensService';

const token = process.env.WHATSAPP_TOKEN;
const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
const appSecret = process.env.WHATSAPP_APP_SECRET;
const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
const versaoDaApi = process.env.WHATSAPP_API_VERSAO;
const remetentesPermitidos = process.env.REMETENTES_PERMITIDOS;
const chaveDoGemini = process.env.GEMINI_API_KEY;
const emailRemetente = process.env.EMAIL_REMETENTE;
const emailSenhaDeApp = process.env.EMAIL_SENHA_DE_APP;
const emailDestino = process.env.EMAIL_DESTINO;

if (
  !token ||
  !phoneNumberId ||
  !appSecret ||
  !verifyToken ||
  !versaoDaApi ||
  !remetentesPermitidos ||
  !chaveDoGemini ||
  !emailRemetente ||
  !emailSenhaDeApp ||
  !emailDestino
) {
  throw new Error('Falta variavel no .env. A lista esta no README.');
}

const formato: Formato = parse(
  await readFile('formato/relatorio.yaml', 'utf8'),
);
const instrucoes = await readFile('formato/instrucoes.md', 'utf8');

const mensagens = new ArquivoMensagemStore('dados');
const transcritor = new WhisperTranscritor('small');

const gerarRelatorio = new GerarRelatorioService(
  formato,
  mensagens,
  transcritor,
  new GeminiInterpretador(
    chaveDoGemini,
    ['gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-3.5-flash'],
    instrucoes,
  ),
  new MontarRelatorioService(),
  new DocxRelatorioRenderer('formato/modelo.docx', 'dados/midias'),
  new ArquivoRelatorioStore('saida'),
  new GmailEmailSender(emailRemetente, emailSenhaDeApp, emailDestino),
);

const receberMensagens = new ReceberMensagensService(
  mensagens,
  new GraphWhatsAppClient(versaoDaApi, phoneNumberId, token),
  transcritor,
  gerarRelatorio,
  formato.palavraChave,
  new Set(remetentesPermitidos.split(',').map(numero => numero.trim())),
);

const app = Fastify();
mapearWebhookEndpoints(
  app,
  new WebhookHandlers(receberMensagens, verifyToken),
  appSecret,
);
await app.listen({ port: 3000 });
console.log('Webhook ouvindo na porta 3000');
