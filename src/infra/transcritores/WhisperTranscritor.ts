import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { Midia } from '../../models/Midia';
import { ITranscritor } from '../../services/ITranscritor';

const SCRIPT_DO_WHISPER = fileURLToPath(
  new URL('./whisper.py', import.meta.url),
);

export class WhisperTranscritor implements ITranscritor {
  public constructor(private modelo: string) {}

  public transcrever(audio: Midia): Promise<string> {
    const transcricao = new Promise<string>((resolver, rejeitar) => {
      const processo = spawn('python', [SCRIPT_DO_WHISPER, this.modelo]);
      const saida: Buffer[] = [];
      const erros: Buffer[] = [];

      processo.stdout.on('data', trecho => saida.push(trecho));
      processo.stderr.on('data', trecho => erros.push(trecho));
      processo.on('error', rejeitar);
      processo.on('close', codigo => {
        if (codigo !== 0) {
          const ultimaLinhaDoPython = Buffer.concat(erros)
            .toString('utf8')
            .trim()
            .split('\n')
            .at(-1);
          rejeitar(
            new Error(
              `Whisper saiu com codigo ${codigo}: ${ultimaLinhaDoPython}`,
            ),
          );
          return;
        }
        resolver(Buffer.concat(saida).toString('utf8').trim());
      });

      processo.stdin.end(audio.conteudo);
    });
    return transcricao;
  }
}
