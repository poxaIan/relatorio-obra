import nodemailer, { type Transporter } from 'nodemailer';
import { IEmailSender } from '../../services/IEmailSender';

export class GmailEmailSender implements IEmailSender {
  private transporte: Transporter;

  public constructor(
    private remetente: string,
    senhaDeApp: string,
    private destino: string,
  ) {
    this.transporte = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: remetente, pass: senhaDeApp },
    });
  }

  public async enviar(
    assunto: string,
    anexo: { nome: string; conteudo: Uint8Array },
  ): Promise<void> {
    await this.transporte.sendMail({
      from: this.remetente,
      to: this.destino,
      subject: assunto,
      text: assunto,
      attachments: [
        { filename: anexo.nome, content: Buffer.from(anexo.conteudo) },
      ],
    });
  }
}
