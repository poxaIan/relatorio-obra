export interface IEmailSender {
  enviar(
    assunto: string,
    anexo: { nome: string; conteudo: Uint8Array },
  ): Promise<void>;
}
