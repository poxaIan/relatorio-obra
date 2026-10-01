export interface MensagemRecebida {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: { body: string };
  image?: { id: string; caption?: string };
  audio?: { id: string };
}

export interface NotificacaoDoWhatsApp {
  entry: {
    changes: {
      value: {
        messages?: MensagemRecebida[];
      };
    }[];
  }[];
}
