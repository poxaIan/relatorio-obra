# relatorio-obra

Gera o relatório de atividades de uma obra, em Word, a partir dos registros feitos
durante o período.

## Subir depois de desligar o PC

A aplicação roda neste PC em dois processos: o servidor, na porta 3000, e o túnel do
ngrok, que publica a porta 3000 num domínio fixo. Fechar o navegador não derruba
nenhum dos dois; desligar o PC derruba os dois, e eles não voltam sozinhos.

Abra dois PowerShell, rode um comando em cada e deixe as duas janelas abertas:

```powershell
cd D:\Ian\obsidian\github\relatorio-obra
npm run webhook
```

```powershell
ngrok http 3000 --url=https://tiring-eatery-habitant.ngrok-free.dev
```

O domínio não muda, então não é preciso mexer na Meta. Enquanto a aplicação está
parada, a Meta guarda as mensagens e reenvia por até 7 dias.

## Rodar

```powershell
npm install
npm run gerar -- 2026-09-15
```

A data escolhe o período: o mês dela no formato `mensal`, a semana dela no
`semanal`. O relatório sai em `saida/`.

## Webhook do WhatsApp

Recebe as mensagens pela WhatsApp Cloud API. Guarda cada uma em `dados/mensagens/`,
baixa foto e áudio para `dados/midias/` e transcreve o áudio com o Whisper local
(`py -m pip install faster-whisper`).

Quando chega a palavra-chave do `relatorio.yaml` (`relatorio`, sem acento e em
minúsculas), o Claude organiza as mensagens do período em registros por seção,
seguindo `formato/instrucoes.md`. O .docx é salvo em `saida/` e enviado por e-mail.

O `.env`, fora do git, precisa de:

| Variável | De onde vem |
| --- | --- |
| `WHATSAPP_TOKEN` | o token de acesso: o temporário da tela *API Setup* ou o permanente do usuário do sistema |
| `WHATSAPP_PHONE_NUMBER_ID` | *API Setup* → Phone number ID |
| `WHATSAPP_APP_SECRET` | *App settings → Basic* → App secret |
| `WHATSAPP_VERIFY_TOKEN` | um texto qualquer que você inventa e repete na configuração do webhook na Meta |
| `WHATSAPP_API_VERSAO` | a versão que aparece no exemplo `curl` da *API Setup*, como `v25.0` |
| `REMETENTES_PERMITIDOS` | os números aceitos, separados por vírgula, no formato do `from` da Meta, como `553191453062`. As outras mensagens são ignoradas |
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) → *API Keys* |
| `EMAIL_REMETENTE` | a conta do Gmail que envia |
| `EMAIL_SENHA_DE_APP` | a senha de app dessa conta, gerada em [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) com a verificação em duas etapas ligada |
| `EMAIL_DESTINO` | quem recebe o relatório |

O `relatorio.yaml` e o `instrucoes.md` são lidos quando o servidor sobe. Depois de
mudar qualquer um dos dois, reinicie o `npm run webhook`.

Na Meta, em *WhatsApp → Configuration → Webhook*, a URL de callback é o domínio do
ngrok mais `/webhook`, o verify token é o mesmo do `.env`, sem as aspas, e o campo
assinado é `messages`.

## Mudar o formato

O formato mora em `formato/`, e mudar o formato não mexe no código.

| Arquivo | O que decide |
| --- | --- |
| `relatorio.yaml` | se o período é mensal ou semanal, e quais seções existem, em que ordem e quais são divididas por semana. A `descricao` de cada seção é o que a IA usa para decidir onde cada registro entra |
| `instrucoes.md` | como a IA escreve: tom, legenda das fotos e o que deixar de fora |
| `modelo.docx` | a aparência: cabeçalho, texto fixo, estilos, a forma de cada título e legenda. É editado no Word |

Uma seção nova entra só no YAML. O modelo percorre todas as seções, então ela aparece
sem precisar mexer no Word.

### Comandos do modelo

Tudo que está entre `{ }` no `modelo.docx` é comando. O resto é texto normal do Word.

| Comando | O que faz |
| --- | --- |
| `{periodo.mes}` · `{periodo.inicio}` · `{periodo.fim}` | `SETEMBRO/26`, `01/09/2026`, `30/09/2026` |
| `{FOR secao IN secoes}` … `{END-FOR secao}` | repete o trecho para cada seção do YAML |
| `{$secao.numero}` · `{$secao.titulo}` | número e título da seção |
| `{IF $secao.vazia}` … `{END-IF}` | só aparece quando a seção não tem registro |
| `{FOR grupo IN $secao.grupos}` | as semanas, na seção com `porSemana: true`; senão, um grupo só |
| `{$grupo.semana.numero}` · `.inicio` · `.fim` | `01`, `01/09/2026`, `06/09/2026` |
| `{FOR registro IN $grupo.registros}` · `{$registro.texto}` | cada registro, em ordem de data |
| `{FOR foto IN $registro.fotos}` · `{IMAGE imagem($foto.arquivo)}` | a foto, com no máximo 15 × 10 cm |
| `{$foto.numero}` · `{$foto.legenda}` | a numeração das figuras corre pelo documento inteiro |

A formatação vale para o comando inteiro. Um título em negrito com `{$secao.titulo}`
dentro sai em negrito.

## Exemplo

`exemplo/` tem registros e fotos fictícios, e é daí que o `npm run gerar` lê por
enquanto.
