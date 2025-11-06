# Scripts JSON

Esta pasta contém os arquivos JSON com os roteiros que serão carregados automaticamente no sistema.

## Estrutura do JSON

Cada arquivo JSON deve seguir o formato:

\`\`\`json
{
  "marcas": {
    "NOME_DO_PRODUTO": {
      "step_id_1": {
        "title": "Título da Tela",
        "content": "Conteúdo do roteiro...",
        "buttons": [
          {
            "label": "Texto do Botão",
            "nextStepId": "step_id_2"
          }
        ]
      },
      "step_id_2": {
        "title": "Segunda Tela",
        "content": "Mais conteúdo..."
      }
    }
  }
}
\`\`\`

## Como usar

1. Coloque seus arquivos JSON nesta pasta
2. Os scripts serão carregados automaticamente quando o sistema iniciar
3. Você também pode usar o botão "Importar JSON" na interface para importar scripts adicionais

## Exemplo

Veja o arquivo `exemplo-script.json` para referência.
