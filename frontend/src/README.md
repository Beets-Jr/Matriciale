# Sistema de Análise de Reposição de Estoque Farmacêutico

## Metodologia Matriciale

Sistema completo para análise e previsão de demanda de medicamentos baseado na metodologia Matriciale, processando dados de balancete e movimentação para gerar relatórios de reposição.

## Instalação

```bash
cd frontend/src
npm install
```

## Uso

### Preparação dos Dados

1. Coloque os arquivos na pasta `data/input/`:
   - **Balancetes**: Arquivos `.xlsx` com dados de estoque
   - **Movimentações**: Arquivos `.pdf` com relatórios de movimentação

### Execução

```bash
# Executar processamento completo
node script.js

# Executar em modo debug
node script.js --debug

# Executar com dados de teste
node script.js --test
```

### Estrutura de Arquivos de Entrada

#### Balancete (XLSX)
- Formato conforme mapeamento definido no sistema
- Colunas: código, descrição, quantidades, valores
- Exemplo: `Balancete CAF 01-06.xlsx`

#### Movimentação (PDF)
- Relatórios de movimentação de estoque
- Formato padrão com páginas por produto
- Exemplo: `Movimentação CAF 01-06 PDF.pdf`

## Saídas do Sistema

### Estrutura de Output

```
data/output/[TIMESTAMP]_processamento/
├── intermediarios/          # Dados processados
│   ├── balancete_processado.json
│   ├── movimentacao_processada.json
│   ├── dados_sinteticos.json
│   ├── base_consolidada.json
│   └── metricas_calculadas.json
├── logs/                    # Logs de processamento
│   ├── processamento.log
│   ├── validacoes.log
│   └── erros.log
├── relatorios_finais/       # Relatórios Excel
│   ├── reposicao_farmacia_[UNIDADE]_[TIMESTAMP].xlsx
│   ├── reposicao_caf_[TIMESTAMP].xlsx
│   ├── dashboard_executivo.xlsx
│   └── auditoria_calculos.xlsx
└── estatisticas/            # Resumos e métricas
    ├── resumo_processamento.json
    ├── metricas_qualidade.json
    └── indicadores_negocio.json
```

### Relatórios Principais

#### 1. Reposição por Farmácia
- Análise individual por unidade
- Cálculo de reposição para 3 semanas
- Todas as métricas Matriciale

#### 2. Reposição CAF
- Consolidação de todas as unidades
- Cálculo de reposição para 12 semanas
- Visão estratégica do estoque central

#### 3. Dashboard Executivo
- KPIs principais
- Top reposições
- Análise por classificação
- Farmácias críticas
- Tendências de movimento

#### 4. Auditoria de Cálculos
- Validação de medianas
- Dados sintéticos
- Classificações aplicadas
- Alertas e erros

## Metodologia

### Classificação de Itens
1. **1 REMUME** - Medicamentos básicos municipais
2. **2 ASSISTENCIAL** - Medicamentos para grupos específicos
3. **3 PROCESSO JUDICIAL** - Medicamentos por mandado judicial
4. **4 FARMACOLÓGICO** - Injetáveis de uso interno
5. **5 MATERIAL** - Material hospitalar
6. **6 FRALDAS e/ou LEITES** - Itens assistenciais controlados

### Tipificação de Movimentação
- **SA** - Dispensação para pacientes
- **SU** - Transferência para unidades
- **EA** - Entradas de fornecedores
- **ST** - Transferências entre farmácias
- Outros tipos conforme histórico

### Padrões de Movimento
- **ENTRANTES** - Itens recém-introduzidos
- **INATIVOS** - Sem movimento por 16+ semanas
- **RECENTES** - Alta frequência nas últimas 26 semanas
- **ORDINÁRIOS** - Padrão regular nas últimas 52 semanas
- **INTERMITENTES** - Uso esporádico

### Algoritmo de Previsão
- **ENTRANTES**: Valor da única ocorrência
- **INATIVOS**: 0
- **INTERMITENTES**: max(1, Máxima ÷ 4)
- **ORDINÁRIOS/RECENTES**: max de todas as medianas

## Validação e Auditoria

### Dados Sintéticos
- 52 semanas de histórico simulado
- 70% de frequência de movimentação
- Padrões sazonais incluídos
- Apenas tipos SA e SU

### Validações Automáticas
- Integridade de códigos de produtos
- Consistência entre balancete e movimentação
- Validação de medianas calculadas
- Alertas para reposições críticas

## Logs e Monitoramento

### Processamento
- Início e fim de cada etapa
- Quantidade de registros processados
- Tempo de execução

### Validações
- Itens sem classificação
- Movimentações inconsistentes
- Códigos inválidos

### Erros
- Falhas de processamento
- Arquivos corrompidos
- Dados inválidos

## Solução de Problemas

### Erros Comuns

1. **Arquivos não encontrados**
   - Verificar pasta `data/input/`
   - Conferir nomenclatura dos arquivos

2. **Erro de memória**
   - Processar arquivos menores
   - Aumentar heap do Node.js: `node --max-old-space-size=4096 script.js`

3. **PDF corrompido**
   - Recriar PDF a partir do sistema original
   - Verificar se não está protegido por senha

4. **Dados inconsistentes**
   - Verificar logs de validação
   - Conferir formato dos arquivos XLSX

### Depuração

```bash
# Executar com logs detalhados
node script.js --debug

# Verificar logs específicos
tail -f data/output/*/logs/processamento.log
```

## Versão
Sistema Matriciale v1.0.0

## Dependências
- Node.js 14+
- xlsx ^0.18.5
- pdf-parse ^1.1.1
- moment ^2.29.4
- lodash ^4.17.21

## Contato
Para dúvidas sobre a metodologia ou uso do sistema, consulte a documentação técnica em `data/context/orientacoes.md`. 