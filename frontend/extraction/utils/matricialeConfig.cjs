/**
 * Configurações para o processamento de arquivos da Matriciale
 */

export const MATRICIALE_CONFIG = {
  // Unidades a serem processadas
  units: ['CAF', 'ESF3', 'Olavo'],
  
  // Tipos de arquivo suportados
  fileTypes: {
    xlsx: ['Balancete', 'Movimentacao'],
    pdf: ['Balancete', 'Movimentacao']
  },

  // Mapeamento de headers para normalização
  headerMappings: {
    // Códigos de item
    'COD_ITEM': 'CODIGO_ITEM',
    'CODIGO': 'CODIGO_ITEM',
    'ITEM': 'CODIGO_ITEM',
    'COD': 'CODIGO_ITEM',
    
    // Descrições
    'DESCRICAO': 'DESCRICAO_ITEM',
    'DESCRICAO_DO_ITEM': 'DESCRICAO_ITEM',
    'NOME': 'DESCRICAO_ITEM',
    'NOME_DO_ITEM': 'DESCRICAO_ITEM',
    'PRODUTO': 'DESCRICAO_ITEM',
    
    // Unidades de medida
    'UNIDADE': 'UNIDADE_MEDIDA',
    'UND': 'UNIDADE_MEDIDA',
    'UM': 'UNIDADE_MEDIDA',
    'UNID': 'UNIDADE_MEDIDA',
    
    // Quantidades
    'QTDE': 'QUANTIDADE',
    'QUANTIDADE': 'QUANTIDADE',
    'QTD': 'QUANTIDADE',
    'QT': 'QUANTIDADE',
    
    // Valores
    'VALOR_UNITARIO': 'VALOR_UNITARIO',
    'VLR_UNIT': 'VALOR_UNITARIO',
    'PRECO': 'VALOR_UNITARIO',
    'PRECO_UNITARIO': 'VALOR_UNITARIO',
    'VLR_UNITARIO': 'VALOR_UNITARIO',
    
    'VALOR_TOTAL': 'VALOR_TOTAL',
    'VLR_TOTAL': 'VALOR_TOTAL',
    'TOTAL': 'VALOR_TOTAL',
    'SUBTOTAL': 'VALOR_TOTAL',
    
    // Datas
    'DATA': 'DATA',
    'DT': 'DATA',
    'DATA_MOVIMENTACAO': 'DATA',
    'DATA_BALANCETE': 'DATA',
    
    // Movimentações
    'ENTRADA': 'ENTRADA',
    'ENTRADAS': 'ENTRADA',
    'ENT': 'ENTRADA',
    
    'SAIDA': 'SAIDA',
    'SAIDAS': 'SAIDA',
    'SAI': 'SAIDA',
    
    // Estoque
    'ESTOQUE': 'ESTOQUE',
    'SALDO': 'ESTOQUE',
    'SALDO_ATUAL': 'ESTOQUE',
    'ESTOQUE_ATUAL': 'ESTOQUE'
  },

  // Palavras-chave para identificar cabeçalhos em PDFs
  pdfHeaderKeywords: [
    'CÓDIGO', 'CODIGO', 'ITEM', 'DESCRIÇÃO', 'DESCRICAO',
    'QUANTIDADE', 'QTDE', 'QTD', 'UNIDADE', 'UND',
    'VALOR', 'PREÇO', 'PRECO', 'TOTAL', 'DATA',
    'ENTRADA', 'SAIDA', 'ESTOQUE', 'SALDO'
  ],

  // Configurações de processamento
  processing: {
    // Número mínimo de colunas para considerar uma linha como dados válidos
    minColumnsForData: 5,
    
    // Número mínimo de palavras-chave para considerar uma linha como cabeçalho
    minKeywordsForHeader: 3,
    
    // Caracteres de debug para texto extraído de PDF
    pdfDebugTextLength: 1000,
    
    // Filtros para linhas vazias
    filterEmptyRows: true,
    
    // Normalizar valores automaticamente
    autoNormalize: true
  },

  // Configurações de output
  output: {
    // Incluir metadados nos arquivos JSON
    includeMetadata: true,
    
    // Indentação dos arquivos JSON (null = compacto, número = espaços)
    jsonIndentation: 2,
    
    // Prefixos para arquivos de output
    filePrefixes: {
      xlsx: '_data',
      pdf: '_pdf_data',
      consolidated: '_consolidated',
      all: 'matriciale_all_data',
      report: 'processing_report'
    }
  },

  // Validações
  validation: {
    // Validar códigos de item (devem ser numéricos)
    validateItemCodes: true,
    
    // Validar valores monetários (devem ser números positivos)
    validateCurrencyValues: true,
    
    // Validar datas
    validateDates: true,
    
    // Campos obrigatórios para cada tipo de arquivo
    requiredFields: {
      balancete: ['CODIGO_ITEM', 'DESCRICAO_ITEM', 'QUANTIDADE'],
      movimentacao: ['CODIGO_ITEM', 'DESCRICAO_ITEM', 'DATA']
    }
  },

  // Configurações específicas por unidade
  unitSpecificConfig: {
    'CAF': {
      // Configurações específicas para CAF
      customHeaderMappings: {},
      specialProcessing: false
    },
    'ESF3': {
      // Configurações específicas para ESF3
      customHeaderMappings: {},
      specialProcessing: false
    },
    'Olavo': {
      // Configurações específicas para Olavo
      customHeaderMappings: {},
      specialProcessing: false
    }
  },

  // Configurações de log
  logging: {
    // Nível de log (error, warn, info, debug)
    level: 'info',
    
    // Incluir timestamps nos logs
    includeTimestamps: true,
    
    // Salvar logs em arquivo
    saveToFile: false,
    
    // Arquivo de log
    logFile: 'matriciale_processing.log'
  },

  // Configurações de erro
  errorHandling: {
    // Continuar processamento em caso de erro em um arquivo
    continueOnError: true,
    
    // Máximo de erros antes de parar o processamento
    maxErrors: 10,
    
    // Incluir stack trace nos logs de erro
    includeStackTrace: false
  }
};

/**
 * Função para obter configuração mesclada com overrides
 */
export function getConfig(overrides = {}) {
  return {
    ...MATRICIALE_CONFIG,
    ...overrides
  };
}

/**
 * Função para obter configuração específica de uma unidade
 */
export function getUnitConfig(unit, overrides = {}) {
  const baseConfig = getConfig(overrides);
  const unitConfig = baseConfig.unitSpecificConfig[unit] || {};
  
  return {
    ...baseConfig,
    ...unitConfig
  };
}

export default MATRICIALE_CONFIG; 