import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { createReport } from 'docx-templates';
import { imageSize } from 'image-size';
import { Relatorio } from '../../models/Relatorio';
import { IRelatorioRenderer } from '../../services/IRelatorioRenderer';

const LARGURA_MAXIMA_CM = 15;
const ALTURA_MAXIMA_CM = 10;

export class DocxRelatorioRenderer implements IRelatorioRenderer {
  public constructor(
    private caminhoDoModelo: string,
    private pastaDasFotos: string,
  ) {}

  public async renderizar(relatorio: Relatorio): Promise<Uint8Array> {
    const modelo = await readFile(this.caminhoDoModelo);

    const docx = await createReport({
      template: modelo,
      data: relatorio,
      cmdDelimiter: ['{', '}'],
      additionalJsContext: {
        imagem: async (arquivo: string) => {
          const conteudo = await readFile(join(this.pastaDasFotos, arquivo));
          const { width, height } = imageSize(conteudo);
          const escala = Math.min(
            LARGURA_MAXIMA_CM / width,
            ALTURA_MAXIMA_CM / height,
          );
          const imagem = {
            width: width * escala,
            height: height * escala,
            data: conteudo.toString('base64'),
            extension: extname(arquivo).toLowerCase() as
              '.png' | '.jpg' | '.jpeg',
          };
          return imagem;
        },
      },
    });
    return docx;
  }
}
