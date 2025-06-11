# Extração de Dados de PDF - Relatórios de Movimentação

## Visão Geral

Esta funcionalidade permite extrair dados estruturados de PDFs de Relatórios de Movimentação de Estoque da Matriciale, convertendo-os automaticamente para o formato JSON especificado.

## Formato de Saída

A extração gera dados no seguinte formato JSON:

```json
{
  "PREFEITURA MUNICIPAL": "NOME_DA_PREFEITURA",
  "Relatório de Movimentação de Estoque": "PERÍODO_DO_RELATÓRIO",
  "Paginas": [
    {
      "Página": 1,
      "Produto": {
        "Nome": "NOME_DO_MEDICAMENTO",
        "CodigoProduto": "XXX.XXX.XXX",
        "Unidade": "CP|AMP|ML|TB|etc"
      },
      "Movimentacao": [
        {
          "Data": "DD/MM/AAAA",
          "Histórico": "DESCRIÇÃO_DA_MOVIMENTAÇÃO",
          "Documento": "XXXXXXX/AAAA",
          "Requisição": "REQ-XXX",
          "Movimento": {
            "Entrada": 1000,
            "Saída": 500
          },
          "Estoque": 8500,
          "Observação": "OBSERVAÇÕES_ADICIONAIS"
        }
      ]
    }
  ]
}
```

## Como Usar

### 1. Upload de Arquivo PDF
- Arraste e solte o arquivo PDF na área designada
- Ou clique em "Escolher Arquivo" e selecione o PDF
- O sistema processará automaticamente e exibirá o resultado

### 2. Teste com Dados Simulados
- Clique no botão "🧪 Testar Extração PDF" 
- Isso executará a extração com dados de teste para validar o funcionamento

## Estrutura do PDF Esperada

O sistema espera PDFs com a seguinte estrutura:

### Cabeçalho (primeira página)
```
PREFEITURA MUNICIPAL DE [NOME_CIDADE]
Relatório de Movimentação de Estoque de DD/MM/AAAA até DD/MM/AAAA
```

### Cada Página do Relatório
```
Página X

NOME_DO_MEDICAMENTO - DOSAGEM
XXX.XXX.XXX                                    UNIDADE

Data        Histórico              Documento    Movimento        Estoque    Observação
                                                Entrada  Saída

DD/MM/AAAA  DESCRIÇÃO             XXXXXXX/AAAA    500      8.500    Observação
```

## Campos Extraídos

### Informações Gerais
- **PREFEITURA MUNICIPAL**: Nome da prefeitura extraído do cabeçalho
- **Relatório de Movimentação de Estoque**: Período do relatório

### Por Página
- **Página**: Número da página
- **Produto**: Informações do medicamento/item
  - **Nome**: Nome completo do produto
  - **CodigoProduto**: Código no formato XXX.XXX.XXX
  - **Unidade**: Unidade de medida (CP, AMP, ML, TB, etc.)

### Por Movimentação
- **Data**: Data da movimentação (DD/MM/AAAA)
- **Histórico**: Descrição da movimentação
- **Documento**: Número do documento (formato XXXXXXX/AAAA)
- **Requisição**: Número da requisição (quando disponível)
- **Movimento**: 
  - **Entrada**: Quantidade de entrada (null se não houver)
  - **Saída**: Quantidade de saída (null se não houver)
- **Estoque**: Saldo resultante após a movimentação
- **Observação**: Observações adicionais (ex: "Transferência nº XXXX")

## Características Técnicas

### Algoritmo de Extração
1. **Identificação de Estrutura**: Detecta cabeçalhos, páginas e produtos
2. **Extração de Dados**: Usa regex e padrões para extrair informações específicas
3. **Normalização**: Converte números e datas para formatos padronizados
4. **Validação**: Verifica consistência dos dados extraídos

### Tratamento de Números
- Suporte a formatos brasileiros (1.000,50) e americanos (1,000.50)
- Remoção automática de caracteres não numéricos
- Conversão para números decimais quando apropriado

### Robustez
- Tolerância a variações de formatação
- Busca por informações em linhas adjacentes quando necessário
- Fallbacks para diferentes padrões de texto

## Debugging

### Console do Navegador
O sistema gera logs detalhados no console:
- Texto bruto extraído do PDF
- Número total de páginas
- Dados estruturados resultantes

### Dados de Teste
Use o botão de teste para validar a extração com dados conhecidos antes de processar PDFs reais.

## Limitações

### Formatos Suportados
- Apenas PDFs com texto selecionável (não imagens escaneadas)
- Estrutura específica dos relatórios da Matriciale

### Variações de Layout
- O sistema foi otimizado para o formato padrão mostrado
- Variações significativas de layout podem requer ajustes no algoritmo

## Resolução de Problemas

### PDF Não Processado
1. Verifique se o PDF contém texto selecionável
2. Confirme se a estrutura segue o padrão esperado
3. Verifique os logs no console do navegador

### Dados Incorretos
1. Use o teste simulado para validar o algoritmo
2. Compare com a estrutura esperada
3. Verifique se há caracteres especiais ou formatação inesperada

### Performance
- PDFs muito grandes podem demorar para processar
- O processo é feito no navegador (client-side)

## Exemplo de Uso Completo

```javascript
// O componente FileConverter já inclui toda a funcionalidade
// Para usar programaticamente:

import { extractMovimentacaoFromPDF } from './path/to/component';

const pdfText = "texto extraído do PDF...";
const result = extractMovimentacaoFromPDF(pdfText);
console.log(result);
```

## Suporte

Para dúvidas ou problemas com a extração de PDF:
1. Verifique os logs no console
2. Use o teste simulado para isolamento de problemas
3. Confirme a estrutura do PDF com os exemplos documentados 