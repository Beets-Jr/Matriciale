# 🏥 Sistema de Processamento de Arquivos Matriciale

Este sistema processa arquivos operacionais da empresa Matriciale, especializada na gestão de estoque de medicamentos e materiais hospitalares. O objetivo é extrair, normalizar e consolidar dados de balancetes e movimentações das diferentes unidades.

## 📁 Estrutura de Arquivos

### Arquivos de Input (src/data/input/)
- **Balancete [UNIDADE] [PERÍODO].xlsx** - Planilhas de balancete
- **Movimentação [UNIDADE] [PERÍODO].xlsx** - Planilhas de movimentação
- **Balancete [UNIDADE] [PERÍODO] PDF.pdf** - Relatórios PDF de balancete
- **Movimentação [UNIDADE] [PERÍODO] PDF.pdf** - Relatórios PDF de movimentação

### Arquivos de Output (src/data/output/)
- **[UNIDADE]_data.json** - Dados extraídos de arquivos XLSX
- **[UNIDADE]_pdf_data.json** - Dados extraídos de arquivos PDF
- **[UNIDADE]_consolidated.json** - Dados consolidados por unidade
- **matriciale_all_data.json** - Todos os dados consolidados
- **processing_report.json** - Relatório detalhado do processamento

## 🚀 Como Usar

### 1. Processamento Completo (Recomendado)
```bash
node src/utils/runProcessor.js all
```
Processa todos os arquivos XLSX e PDF, gerando outputs consolidados.

### 2. Processar Apenas XLSX
```bash
node src/utils/runProcessor.js xlsx
```
Processa apenas planilhas Excel.

### 3. Processar Apenas PDF
```bash
node src/utils/runProcessor.js pdf
```
Processa apenas arquivos PDF.

### 4. Uso Programático
```javascript
import MatricialeMainProcessor from './utils/matricialeProcessor.js';

const processor = new MatricialeMainProcessor();

// Processamento completo
const results = await processor.processAll();

// Apenas XLSX
const xlsxResults = await processor.processXLSXOnly();

// Apenas PDF
const pdfResults = await processor.processPDFOnly();
```

## 📊 Estrutura dos Dados Extraídos

### Campos Normalizados
Todos os dados são normalizados para uma estrutura consistente:

```json
{
  "CODIGO_ITEM": "string",
  "DESCRICAO_ITEM": "string",
  "UNIDADE_MEDIDA": "string",
  "QUANTIDADE": "number",
  "VALOR_UNITARIO": "number",
  "VALOR_TOTAL": "number",
  "DATA": "YYYY-MM-DD",
  "ENTRADA": "number",
  "SAIDA": "number",
  "ESTOQUE": "number"
}
```

### Exemplo de Output Consolidado
```json
{
  "unit": "CAF",
  "processedAt": "2024-01-15T10:30:00.000Z",
  "xlsx": {
    "balancete": {
      "fileName": "Balancete CAF 01-06.xlsx",
      "totalRecords": 150,
      "headers": ["CODIGO_ITEM", "DESCRICAO_ITEM", "QUANTIDADE"],
      "data": [...]
    },
    "movimentacao": {
      "fileName": "Movimentação CAF 01-06.xlsx",
      "totalRecords": 75,
      "headers": ["CODIGO_ITEM", "DESCRICAO_ITEM", "DATA"],
      "data": [...]
    }
  },
  "pdf": {
    "files": [...]
  },
  "summary": {
    "totalXLSXRecords": 225,
    "totalPDFFiles": 2,
    "totalPDFRecords": 180
  }
}
```

## 🔧 Configuração

### Arquivo de Configuração (matricialeConfig.js)
O sistema usa um arquivo de configuração centralizado que permite:

- **Unidades**: Definir quais unidades processar
- **Mapeamento de Headers**: Normalizar nomes de colunas
- **Validações**: Configurar regras de validação
- **Output**: Personalizar formato dos arquivos de saída

### Personalizando Headers
Para adicionar novos mapeamentos de colunas:

```javascript
import { getConfig } from './matricialeConfig.js';

const customConfig = getConfig({
  headerMappings: {
    'NOVO_CAMPO': 'CAMPO_NORMALIZADO',
    'CAMPO_ESPECIAL': 'CAMPO_PADRAO'
  }
});
```

## 📋 Processadores Disponíveis

### 1. MatricialeFileProcessor (fileProcessor.js)
- Processa arquivos XLSX
- Normaliza headers e valores
- Identifica automaticamente unidades e tipos
- Trata datas, números e moedas

### 2. MatricialePDFProcessor (pdfProcessor.js)
- Extrai dados de arquivos PDF
- Identifica tabelas e cabeçalhos
- Converte texto em dados estruturados
- Suporta múltiplos formatos de layout

### 3. MatricialeMainProcessor (matricialeProcessor.js)
- Coordena ambos os processadores
- Consolida resultados
- Gera relatórios
- Organiza outputs por unidade

## 🔍 Funcionalidades Avançadas

### Normalização Automática
- **Códigos de Item**: Convertidos para string
- **Valores Monetários**: Removem símbolos, convertem vírgulas
- **Datas**: Padronizadas para formato ISO (YYYY-MM-DD)
- **Quantidades**: Convertidas para números

### Detecção Inteligente
- **Unidades**: Identificadas pelo nome do arquivo
- **Tipos de Arquivo**: Balancete vs Movimentação
- **Headers**: Detectados automaticamente em PDFs
- **Dados**: Filtrados de headers e totais

### Tratamento de Erros
- Processamento continua mesmo com erros em arquivos individuais
- Logs detalhados de erros
- Relatório final com estatísticas de sucesso/erro

## 📈 Relatórios Gerados

### Processing Report (processing_report.json)
```json
{
  "processedAt": "2024-01-15T10:30:00.000Z",
  "summary": {
    "totalUnits": 3,
    "totalFiles": 12,
    "totalRecords": 1250
  },
  "unitDetails": {
    "CAF": {
      "xlsxFiles": {...},
      "pdfFiles": [...],
      "totalRecords": 400
    }
  },
  "files": {
    "xlsx": [...],
    "pdf": [...]
  }
}
```

## 🛠️ Dependências

### Pacotes Necessários
```json
{
  "xlsx": "^0.18.5",
  "pdf-parse": "^1.1.1",
  "moment": "^2.29.4",
  "papaparse": "^5.4.1"
}
```

### Instalação
```bash
npm install xlsx pdf-parse moment papaparse
```

## 📝 Logs e Debug

### Níveis de Log
- **error**: Apenas erros críticos
- **warn**: Avisos e erros
- **info**: Informações gerais (padrão)
- **debug**: Informações detalhadas

### Ativando Debug
```javascript
const processor = new MatricialeMainProcessor();
// Logs detalhados serão exibidos no console
```

## 🚨 Solução de Problemas

### Problemas Comuns

1. **Arquivo não encontrado**
   - Verificar se os arquivos estão em `src/data/input/`
   - Verificar nomes dos arquivos (devem conter unidade)

2. **Headers não reconhecidos**
   - Adicionar mapeamento em `matricialeConfig.js`
   - Verificar formato das planilhas

3. **Dados não extraídos de PDF**
   - PDFs podem ter layouts complexos
   - Verificar se o texto é selecionável (não imagem)

4. **Valores incorretos**
   - Verificar formato de números e datas nos arquivos originais
   - Ajustar funções de parsing se necessário

### Debugging
Para debug detalhado, adicione logs:

```javascript
// No início dos processadores
console.log('Debug info:', dados);
```

## 📞 Suporte

Para problemas específicos da metodologia Matriciale, consulte os arquivos de contexto em `src/data/context/`.

## 🔄 Atualizações Futuras

- Suporte a novos formatos de arquivo
- Interface web para configuração
- Análise estatística dos dados
- Integração com banco de dados
- API REST para acesso aos dados 