import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { parse } from 'yaml';
import { DocxRelatorioRenderer } from './infra/renderers/DocxRelatorioRenderer';
import { Formato } from './models/Formato';
import { Registro } from './models/Registro';
import { MontarRelatorioService } from './services/MontarRelatorioService';

const referenciaIso = process.argv[2] ?? new Date().toISOString().slice(0, 10);
const referencia = new Date(`${referenciaIso}T00:00:00Z`);

const formato: Formato = parse(
  await readFile('formato/relatorio.yaml', 'utf8'),
);
const registros: Registro[] = JSON.parse(
  await readFile('exemplo/registros.json', 'utf8'),
);

const relatorio = new MontarRelatorioService().execute(
  formato,
  registros,
  referencia,
);
const docx = await new DocxRelatorioRenderer(
  'formato/modelo.docx',
  'exemplo/fotos',
).renderizar(relatorio);

await mkdir('saida', { recursive: true });
const caminhoDaSaida = `saida/relatorio-${referenciaIso}.docx`;
await writeFile(caminhoDaSaida, docx);
console.log(`Relatorio gerado em ${caminhoDaSaida}`);
