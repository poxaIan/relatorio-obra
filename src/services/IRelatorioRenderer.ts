import { Relatorio } from '../models/Relatorio';

export interface IRelatorioRenderer {
  renderizar(relatorio: Relatorio): Promise<Uint8Array>;
}
