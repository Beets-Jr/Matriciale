# Script de Atualização de Município - Medicamentos

## 📋 Descrição

Script unificado para atualização de medicamentos em um município específico, incluindo:
- Atualização de movimentações semanais específicas
- Atualização de estoque baseado na planilha
- Remoção de chaves antigas de movimentações
- Geração de relatórios detalhados em JSON

## 🔧 Configuração

Edite as constantes no início do arquivo `atualizarMunicipio.ts`:

```typescript
// Município a ser atualizado
const MUNICIPIO = 'Palmares';

// Caminho da planilha
const CAMINHO_PLANILHA = './src/onboarding/data/[2025_52] Palmares - Base de Movimentações.xlsx';

// Mapeamento de unidades para abas da planilha
const MAPEAMENTO_UNIDADES: { [nomeUnidade: string]: string } = {
  'CAF': 'CAF',
  'Olavo': 'Olavo',
  'ESF3': 'ESF3'
};

// Chaves a serem DELETADAS (se existirem)
const CHAVES_PARA_DELETAR = ['2025_51', '2025_52', '2026_01'];

// Chave a ser INSERIDA/ATUALIZADA
const CHAVE_MOVIMENTACAO_INSERIR = '2025_51';
```

## 📊 Estrutura da Planilha

O script detecta automaticamente as colunas baseado em:

- **Coluna A**: CLASSIFICAÇÃO
- **Coluna B**: NOME ITEM
- **Coluna C**: COD_ITEM (usado para buscar no banco)
- **Coluna D**: Início das movimentações semanais
- **"Total Geral"**: Detectada automaticamente no cabeçalho
- **"Estoque"**: 13 colunas à direita de "Total Geral"

## 🗂️ Estrutura do Banco de Dados

```
/municipio/{municipio}/unidades/{unidade}/medicamentos_unidade/{id}
```

Exemplo:
```
/municipio/Palmares/unidades/CAF/medicamentos_unidade/0ZQT8TIgDGevRLg9qYT8
```

## 🚀 Execução

```bash
npm run build
node dist/onboarding/update-municipality/atualizarMunicipio.js
```

Ou com ts-node:
```bash
ts-node src/onboarding/update-municipality/atualizarMunicipio.ts
```

## 📄 Relatórios Gerados

Os relatórios são salvos na pasta `./relatorios/` com timestamp:

### 1. `relatorio_geral_{municipio}_{timestamp}.json`
Contém:
- Município processado
- Data de execução
- Chaves deletadas e inseridas
- Resumo por unidade (total processados, atualizados, não encontrados)
- Total geral de atualizações

### 2. `log_detalhado_{municipio}_{timestamp}.json`
Contém array com cada medicamento atualizado:
- Unidade
- ID do documento
- Nome e código do medicamento
- Estoque antes e depois
- Movimentações antes e depois

## 🔍 Como Funciona

1. **Carrega a planilha** e detecta as colunas automaticamente
2. **Para cada unidade** mapeada:
   - Lê os dados da aba correspondente
   - Para cada medicamento na planilha:
     - Busca no banco pelo `cod_item`
     - **Deleta** as chaves especificadas em `movimentacoes_semanais`
     - **Insere/Atualiza** a chave especificada com o valor da planilha
     - **Atualiza** o estoque com o valor da planilha
     - Registra todas as alterações
3. **Gera relatórios** detalhados em JSON

## ⚙️ Funcionalidades Dinâmicas

- ✅ Detecção automática de colunas (baseada em "Total Geral" e "Estoque")
- ✅ Mapeamento configurável de unidades para abas
- ✅ Definição de chaves para deletar
- ✅ Definição de chave para inserir
- ✅ Normalização automática de códigos de itens
- ✅ Relatórios detalhados com timestamp
- ✅ Feedback em tempo real do processamento

## 📝 Exemplo de Saída

```
╔════════════════════════════════════════════════════════════╗
║     SCRIPT DE ATUALIZAÇÃO DE MUNICÍPIO - MEDICAMENTOS     ║
╚════════════════════════════════════════════════════════════╝

🏙️  Município: Palmares
📊 Planilha: [2025_52] Palmares - Base de Movimentações.xlsx
🗑️  Deletando chaves: 2025_51, 2025_52, 2026_01
📥 Inserindo chave: 2025_51

============================================================
📂 UNIDADE: CAF (Aba: "CAF")
============================================================
📊 Colunas detectadas:
   - Movimentação: 2025_51 na coluna índice 3
   - Total Geral: coluna índice 120
   - Estoque: coluna índice 133

🔄 Processando medicamentos...
..........

✅ Resumo da Unidade "CAF":
   - Total processados: 150
   - Total atualizados: 145
   - Total não encontrados: 5
```

## 🐛 Tratamento de Erros

- Valida existência das abas na planilha
- Valida detecção das colunas necessárias
- Trata erros individuais por medicamento (não interrompe o processo)
- Registra medicamentos não encontrados no banco
- Gera logs detalhados para auditoria

## 📌 Notas Importantes

- O script **sempre atualiza o estoque** com o valor da planilha
- As movimentações antigas são **deletadas antes** de inserir as novas
- Apenas a chave especificada é inserida (não todas as movimentações da planilha)
- O código do item é normalizado (remove pontos e zeros à esquerda) para busca
- Os relatórios incluem estado "antes" e "depois" para auditoria completa
