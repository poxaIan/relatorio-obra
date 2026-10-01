export interface IRelatorioStore {
  salvar(nomeDoArquivo: string, docx: Uint8Array): Promise<string>;
}
