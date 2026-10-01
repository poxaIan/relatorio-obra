import { Midia } from '../models/Midia';

export interface ITranscritor {
  transcrever(audio: Midia): Promise<string>;
}
