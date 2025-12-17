# Slides Convertidos

Para exibir apresentações com navegação slide por slide, converta seu arquivo PowerPoint em imagens individuais e coloque-as nesta pasta.

## Estrutura de Pastas Obrigatória

Para um arquivo chamado `TREINAMENTO INICIAL - CAIXA.pptx`, crie:

```
public/presentations/slides/
  └── TREINAMENTO INICIAL - CAIXA/
      ├── slide-001.png
      ├── slide-002.png
      ├── slide-003.png
      └── ...
```

**IMPORTANTE:**
- O nome da pasta deve ser EXATAMENTE o nome do arquivo PPT SEM a extensão
- Os slides devem ser nomeados: `slide-001.png`, `slide-002.png`, etc.
- Ou pode usar apenas: `001.png`, `002.png`, etc.
- Use sempre 3 dígitos com zeros à esquerda (001, 002, 003...)

## Como Converter PPT para Imagens

### Opção 1: PowerPoint (Windows/Mac)
1. Abra o arquivo PPT no PowerPoint
2. Arquivo > Exportar > Alterar Tipo de Arquivo
3. Escolha "PNG" ou "JPEG"
4. Salve - cada slide será salvo como imagem separada
5. Renomeie os arquivos para slide-001.png, slide-002.png, etc.

### Opção 2: Google Slides
1. Faça upload do PPT para Google Drive
2. Abra com Google Slides  
3. Arquivo > Download > PNG (.png)
4. Cada slide será baixado como imagem individual
5. Renomeie para o padrão slide-001.png

### Opção 3: LibreOffice (Gratuito)
1. Abra o PPT no LibreOffice Impress
2. Arquivo > Exportar...
3. Escolha "PNG" como formato
4. Marque "Exportar todos os slides"
5. Renomeie para o padrão slide-001.png

## Exemplo Completo

Para `TREINAMENTO INICIAL - CAIXA.pptx`:

```
public/presentations/slides/TREINAMENTO INICIAL - CAIXA/slide-001.png
public/presentations/slides/TREINAMENTO INICIAL - CAIXA/slide-002.png
public/presentations/slides/TREINAMENTO INICIAL - CAIXA/slide-003.png
```

Depois que os slides estiverem na pasta, basta clicar em "Iniciar Apresentação" e o sistema detectará automaticamente!
