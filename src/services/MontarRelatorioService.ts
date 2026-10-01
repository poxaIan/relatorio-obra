import { Formato } from '../models/Formato';
import { Registro } from '../models/Registro';
import {
  FotoNumerada,
  Grupo,
  Relatorio,
  SecaoDoRelatorio,
} from '../models/Relatorio';

const UM_DIA_MS = 24 * 60 * 60 * 1000;
const DATA_BR = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' });
const NOME_DO_MES = new Intl.DateTimeFormat('pt-BR', {
  month: 'long',
  timeZone: 'UTC',
});

export class MontarRelatorioService {
  public execute(
    formato: Formato,
    registros: Registro[],
    referencia: Date,
  ): Relatorio {
    const idsDoFormato = new Set(formato.secoes.map(secao => secao.id));
    const secoesForaDoFormato = new Set(
      registros
        .map(registro => registro.secao)
        .filter(secao => !idsDoFormato.has(secao)),
    );
    if (secoesForaDoFormato.size > 0) {
      throw new Error(
        `Registros com secao que nao existe no formato: ${[...secoesForaDoFormato].join(', ')}`,
      );
    }

    const { inicio, fim } = this.calcularPeriodo(formato, referencia);
    const inicioIso = inicio.toISOString().slice(0, 10);
    const fimIso = fim.toISOString().slice(0, 10);
    const registrosDoPeriodo = registros
      .filter(registro => registro.data >= inicioIso && registro.data <= fimIso)
      .sort((a, b) => a.data.localeCompare(b.data));

    const primeiraSegunda = this.segundaFeiraDe(inicio);
    const secoes: SecaoDoRelatorio[] = [];
    let proximaFigura = 1;

    for (const secaoDoFormato of formato.secoes) {
      const registrosDaSecao = registrosDoPeriodo.filter(
        registro => registro.secao === secaoDoFormato.id,
      );
      const grupos: Grupo[] = [];

      for (const registro of registrosDaSecao) {
        let grupo = grupos.at(-1);

        if (secaoDoFormato.porSemana) {
          const segundaDoRegistro = this.segundaFeiraDe(
            new Date(`${registro.data}T00:00:00Z`),
          );
          const semanasDesdeOInicio = Math.round(
            (segundaDoRegistro.getTime() - primeiraSegunda.getTime()) /
              (7 * UM_DIA_MS),
          );
          const numeroDaSemana = String(semanasDesdeOInicio + 1).padStart(
            2,
            '0',
          );
          const semanaNova = grupo?.semana?.numero !== numeroDaSemana;

          if (semanaNova) {
            const inicioDaSemana = new Date(
              Math.max(segundaDoRegistro.getTime(), inicio.getTime()),
            );
            const fimDaSemana = new Date(
              Math.min(
                segundaDoRegistro.getTime() + 6 * UM_DIA_MS,
                fim.getTime(),
              ),
            );
            grupo = {
              semana: {
                numero: numeroDaSemana,
                inicio: DATA_BR.format(inicioDaSemana),
                fim: DATA_BR.format(fimDaSemana),
              },
              registros: [],
            };
            grupos.push(grupo);
          }
        }

        if (!grupo) {
          grupo = { registros: [] };
          grupos.push(grupo);
        }

        const fotos: FotoNumerada[] = [];
        for (const foto of registro.fotos) {
          fotos.push({
            numero: proximaFigura,
            arquivo: foto.arquivo,
            legenda: foto.legenda,
          });
          proximaFigura++;
        }

        grupo.registros.push({ texto: registro.texto, fotos });
      }

      secoes.push({
        numero: secoes.length + 1,
        titulo: secaoDoFormato.titulo,
        vazia: registrosDaSecao.length === 0,
        grupos,
      });
    }

    const nomeDoMes = NOME_DO_MES.format(referencia).toUpperCase();
    const anoCurto = String(referencia.getUTCFullYear()).slice(2);
    const relatorio: Relatorio = {
      periodo: {
        mes: `${nomeDoMes}/${anoCurto}`,
        inicio: DATA_BR.format(inicio),
        fim: DATA_BR.format(fim),
      },
      secoes,
    };
    return relatorio;
  }

  public calcularPeriodo(
    formato: Formato,
    referencia: Date,
  ): { inicio: Date; fim: Date } {
    let inicio: Date;
    let fim: Date;
    if (formato.periodo === 'mensal') {
      inicio = new Date(
        Date.UTC(referencia.getUTCFullYear(), referencia.getUTCMonth(), 1),
      );
      fim = new Date(
        Date.UTC(referencia.getUTCFullYear(), referencia.getUTCMonth() + 1, 0),
      );
    } else {
      inicio = this.segundaFeiraDe(referencia);
      fim = new Date(inicio.getTime() + 6 * UM_DIA_MS);
    }

    const periodo = { inicio, fim };
    return periodo;
  }

  private segundaFeiraDe(data: Date): Date {
    const diasDesdeASegunda = (data.getUTCDay() + 6) % 7;
    const segunda = new Date(data.getTime() - diasDesdeASegunda * UM_DIA_MS);
    return segunda;
  }
}
