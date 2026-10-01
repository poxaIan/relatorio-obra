import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Midia } from '../../models/Midia';
import { MensagemRecebida } from '../../models/NotificacaoDoWhatsApp';
import { IMensagemStore } from '../../services/IMensagemStore';

const EXTENSAO_POR_TIPO: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'audio/ogg': 'ogg',
  'audio/mpeg': 'mp3',
  'audio/mp4': 'm4a',
  'audio/aac': 'aac',
  'audio/amr': 'amr',
};
const TIPO_POR_EXTENSAO = Object.fromEntries(
  Object.entries(EXTENSAO_POR_TIPO).map(([tipo, extensao]) => [extensao, tipo]),
);

export class ArquivoMensagemStore implements IMensagemStore {
  public constructor(private pasta: string) {}

  public async salvar(mensagem: MensagemRecebida): Promise<void> {
    const pastaDasMensagens = join(this.pasta, 'mensagens');
    await mkdir(pastaDasMensagens, { recursive: true });
    const caminho = join(
      pastaDasMensagens,
      `${mensagem.timestamp}-${encodeURIComponent(mensagem.id)}.json`,
    );
    await writeFile(caminho, JSON.stringify(mensagem, null, 2));
  }

  public async salvarMidia(idDaMidia: string, midia: Midia): Promise<void> {
    const pastaDasMidias = join(this.pasta, 'midias');
    await mkdir(pastaDasMidias, { recursive: true });
    const tipoSemParametros = midia.mimeType.split(';')[0].trim();
    const extensao = EXTENSAO_POR_TIPO[tipoSemParametros] ?? 'bin';
    await writeFile(
      join(pastaDasMidias, `${idDaMidia}.${extensao}`),
      midia.conteudo,
    );
  }

  public async salvarTranscricao(
    idDaMidia: string,
    texto: string,
  ): Promise<void> {
    await writeFile(join(this.pasta, 'midias', `${idDaMidia}.txt`), texto);
  }

  public async listar(): Promise<MensagemRecebida[]> {
    const pastaDasMensagens = join(this.pasta, 'mensagens');
    await mkdir(pastaDasMensagens, { recursive: true });
    const arquivos = await readdir(pastaDasMensagens);

    const mensagens: MensagemRecebida[] = [];
    for (const arquivo of arquivos) {
      const conteudo = await readFile(join(pastaDasMensagens, arquivo), 'utf8');
      mensagens.push(JSON.parse(conteudo));
    }
    return mensagens;
  }

  public async lerMidia(
    idDaMidia: string,
  ): Promise<{ arquivo: string; midia: Midia }> {
    const pastaDasMidias = join(this.pasta, 'midias');
    const arquivos = await readdir(pastaDasMidias);
    const arquivo = arquivos.find(
      nome => nome.startsWith(`${idDaMidia}.`) && !nome.endsWith('.txt'),
    );
    if (!arquivo) {
      throw new Error(`Midia ${idDaMidia} nao foi baixada`);
    }

    const extensao = arquivo.slice(arquivo.lastIndexOf('.') + 1);
    const midiaLida = {
      arquivo,
      midia: {
        mimeType: TIPO_POR_EXTENSAO[extensao] ?? 'application/octet-stream',
        conteudo: await readFile(join(pastaDasMidias, arquivo)),
      },
    };
    return midiaLida;
  }

  public async lerTranscricao(idDaMidia: string): Promise<string | undefined> {
    let transcricao: string | undefined;
    try {
      transcricao = await readFile(
        join(this.pasta, 'midias', `${idDaMidia}.txt`),
        'utf8',
      );
    } catch (erro) {
      const arquivoNaoExiste =
        (erro as NodeJS.ErrnoException).code === 'ENOENT';
      if (!arquivoNaoExiste) {
        throw erro;
      }
    }
    return transcricao;
  }
}
