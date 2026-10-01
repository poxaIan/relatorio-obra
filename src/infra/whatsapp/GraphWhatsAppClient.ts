import { Midia } from '../../models/Midia';
import { IWhatsAppClient } from '../../services/IWhatsAppClient';

export class GraphWhatsAppClient implements IWhatsAppClient {
  public constructor(
    private versaoDaApi: string,
    private phoneNumberId: string,
    private token: string,
  ) {}

  public async responder(
    para: string,
    idDaMensagem: string,
    texto: string,
  ): Promise<void> {
    const resposta = await fetch(
      `https://graph.facebook.com/${this.versaoDaApi}/${this.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: para,
          type: 'text',
          context: { message_id: idDaMensagem },
          text: { body: texto },
        }),
      },
    );

    if (!resposta.ok) {
      const erro = await resposta.text();
      throw new Error(`Graph API respondeu ${resposta.status}: ${erro}`);
    }
  }

  public async baixarMidia(idDaMidia: string): Promise<Midia> {
    const autorizacao = { Authorization: `Bearer ${this.token}` };

    const respostaDosDados = await fetch(
      `https://graph.facebook.com/${this.versaoDaApi}/${idDaMidia}`,
      { headers: autorizacao },
    );
    if (!respostaDosDados.ok) {
      const erro = await respostaDosDados.text();
      throw new Error(
        `Graph API respondeu ${respostaDosDados.status}: ${erro}`,
      );
    }
    const dados = (await respostaDosDados.json()) as {
      url: string;
      mime_type: string;
    };

    const respostaDoArquivo = await fetch(dados.url, { headers: autorizacao });
    if (!respostaDoArquivo.ok) {
      throw new Error(
        `Download da midia respondeu ${respostaDoArquivo.status}`,
      );
    }

    const midia: Midia = {
      mimeType: dados.mime_type,
      conteudo: new Uint8Array(await respostaDoArquivo.arrayBuffer()),
    };
    return midia;
  }
}
