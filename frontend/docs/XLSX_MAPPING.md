# Mapeamento de Colunas XLSX - Sistema Matriciale

## Visão Geral

Este sistema processa arquivos XLSX de balancete da Matriciale, mapeando cada coluna para campos estruturados conforme a especificação oficial.

## Estrutura do Arquivo XLSX

O arquivo deve seguir o formato padrão do sistema Fiorilli com as seguintes colunas:

| Coluna | Nome da Coluna | Campo Normalizado | Tipo | Observações |
|--------|----------------|-------------------|------|-------------|
| A | Código sistêmico do item | `cod_sistemico_item` | texto | 9 números e 2 pontos (ex: 325.023.001) |
| B | Descrição (nome) do item | `descricao_item` | texto | Nome completo do medicamento/item |
| C | Coluna em branco | `coluna_branco` | vazio | Campo não utilizado |
| D | Unidade do item | `unidade_item` | texto | cp, ev, tb, amp, etc. |
| E | Quantidade período inicial | `qtd_periodo_inicial` | número | Estoque inicial do período |
| F | Valor do item período inicial | `valor_item_periodo_inicial` | número | Valor monetário inicial |
| G | Quantidade de entradas no período | `qtd_entradas_periodo` | número | Total de entradas |
| H | Valor de entradas no período | `valor_entradas_periodo` | número | Valor monetário das entradas |
| I | Quantidade de saídas no período | `qtd_saidas_periodo` | número | Total de saídas |
| J | Valor de saídas no período | `valor_saidas_periodo` | número | Valor monetário das saídas |
| K | Quantidade período final (estoque atual) | `qtd_periodo_final` | número | Estoque final calculado |
| L | Valor unitário do item período final | `val_unit_periodo_final` | número | Valor médio por unidade |
| M | Valor do item período final | `valor_item_periodo_final` | número | Valor total final |

## Formato de Saída JSON

```json
[
  {
    "cod_sistemico_item": "325.023.001",
    "descricao_item": "AAS - ÁCIDO ACETIL SALICÍLICO 100MG",
    "coluna_branco": null,
    "unidade_item": "CP",
    "qtd_periodo_inicial": 1200,
    "valor_item_periodo_inicial": 12000.00,
    "qtd_entradas_periodo": 500,
    "valor_entradas_periodo": 5000.00,
    "qtd_saidas_periodo": 200,
    "valor_saidas_periodo": 2000.00,
    "qtd_periodo_final": 1500,
    "val_unit_periodo_final": 8.00,
    "valor_item_periodo_final": 12000.00,
    "_linha_original": 1,
    "_dados_brutos": ["325.023.001", "AAS - ÁCIDO ACETIL SALICÍLICO 100MG", "", "CP", "1200", "12000.00", "500", "5000.00", "200", "2000.00", "1500", "8.00", "12000.00"]
  }
]
```

## Processamento Automático

### 1. Detecção de Dados
- Busca automaticamente a primeira linha com dados válidos
- Ignora cabeçalhos e linhas vazias
- Valida presença de código (coluna A) e descrição (coluna B)

### 2. Conversão de Tipos
- **Números**: Converte strings para números, tratando formatos brasileiros
  - `1.000,50` → `1000.50`
  - `1,50` → `1.50`
  - `1000` → `1000`
- **Texto**: Remove espaços extras e normaliza
- **Vazios**: Converte para `null`

### 3. Metadados Adicionais
- `_linha_original`: Número da linha no arquivo original
- `_dados_brutos`: Array com valores originais da linha

## Como Usar

### 1. Upload de Arquivo
```javascript
// Arraste e solte arquivo XLSX ou use o botão "Escolher Arquivo"
// O sistema processará automaticamente
```

### 2. Teste com Dados Simulados
```javascript
// Clique no botão "📊 Testar XLSX" para validar com dados de exemplo
```

### 3. Resultado
```javascript
{
  "totalRecords": 3,
  "columnMapping": [...], // Definição das colunas
  "data": [...] // Dados processados
}
```

## Tratamento de Erros

### Linhas Inválidas
- Linhas sem código (coluna A) são ignoradas
- Linhas sem descrição (coluna B) são ignoradas
- Células vazias são convertidas para `null`

### Conversão de Números
- Se não conseguir converter, mantém como string
- Valores inválidos são definidos como `null`

### Logs de Debug
```javascript
console.log('📊 Dados brutos XLSX:', rawData.slice(0, 5));
console.log('📋 Linha de início dos dados:', startRow);
console.log('✅ Processadas N linhas de dados XLSX');
console.log('📋 Exemplo de linha processada:', processedData[0]);
```

## Códigos de Referência

### Definição das Colunas (hardcoded no componente)
```javascript
const xlsxColumnMapping = [
  {
    "coluna": "A",
    "nome_coluna": "Código sistêmico do item",
    "nome_normalizado": "cod_sistemico_item",
    "tipo": "texto",
    "formato": "9 números e 2 pontos divisor de milhar (ex: 325.023.001)"
  },
  // ... resto das colunas
];
```

### Processamento de Célula
```javascript
xlsxColumnMapping.forEach((colDef, index) => {
  const cellValue = row[index] || '';
  const normalizedName = colDef.nome_normalizado;
  
  // Processar conforme tipo: número, texto, vazio
  let processedValue = processValue(cellValue, colDef.tipo);
  
  mappedRow[normalizedName] = processedValue;
});
```

## Diferenças do Sistema Anterior

### Antes
- Extração genérica baseada em headers encontrados
- Conversão inconsistente de tipos
- Dependência de headers corretos no arquivo

### Agora
- Mapeamento fixo baseado em posição das colunas (A-M)
- Conversão padronizada de tipos brasileiros
- Estrutura JSON consistente e previsível
- Metadados adicionais para debug

## Integração com PDF

O sistema mantém dois processadores independentes:
- **XLSX**: Mapeamento fixo de colunas de balancete
- **PDF**: Extração estruturada de relatórios de movimentação

Ambos podem ser usados na mesma interface, com botões de teste separados.

## Exemplo Completo

```javascript
// Input XLSX (linha):
["325.023.001", "AAS - ÁCIDO ACETIL SALICÍLICO 100MG", "", "CP", "1.200", "12.000,00", ...]

// Output JSON:
{
  "cod_sistemico_item": "325.023.001",
  "descricao_item": "AAS - ÁCIDO ACETIL SALICÍLICO 100MG",
  "coluna_branco": null,
  "unidade_item": "CP",
  "qtd_periodo_inicial": 1200,
  "valor_item_periodo_inicial": 12000.00,
  // ... resto dos campos
}
``` 