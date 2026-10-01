import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { IRelatorioStore } from '../../services/IRelatorioStore';

export class ArquivoRelatorioStore implements IRelatorioStore {
  public constructor(private pasta: string) {}

  public async salvar(
    nomeDoArquivo: string,
    docx: Uint8Array,
  ): Promise<string> {
    await mkdir(this.pasta, { recursive: true });
    const caminho = join(this.pasta, nomeDoArquivo);
    await writeFile(caminho, docx);
    return caminho;
  }
}
