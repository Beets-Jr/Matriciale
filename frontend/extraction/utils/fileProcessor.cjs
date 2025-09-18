import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

/**
 * Processador principal para arquivos da Matriciale
 * Extrai dados de arquivos XLSX e organiza por unidade
 */
class MatricialeFileProcessor {
  constructor() {
    this.inputDir = path.join(process.cwd(), 'src/data/input');
    this.outputDir = path.join(process.cwd(), 'src/data/output');
    this.units = ['CAF', 'ESF3', 'Olavo'];
    this.fileTypes = ['Balancete', 'Movimentação'];
    
    // Garantir que o diretório de output existe
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Processa um arquivo XLSX e extrai os dados
   */
  async processXLSXFile(filePath) {
    try {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Extrair dados com headers normalizados
      const rawData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1, // Usar array de arrays primeiro para analisar estrutura
        defval: ''
      });

      // Encontrar a linha de cabeçalho (primeira linha não vazia com múltiplas colunas)
      let headerRowIndex = -1;
      for (let i = 0; i < rawData.length; i++) {
        if (rawData[i] && rawData[i].length > 5) { // Assumindo que dados válidos têm pelo menos 6 colunas
          headerRowIndex = i;
          break;
        }
      }

      if (headerRowIndex === -1) {
        throw new Error('Não foi possível encontrar linha de cabeçalho');
      }

      const headers = rawData[headerRowIndex];
      const dataRows = rawData.slice(headerRowIndex + 1);

      // Normalizar headers
      const normalizedHeaders = this.normalizeHeaders(headers);
      
      // Converter para objetos
      const processedData = dataRows
        .filter(row => row && row.some(cell => cell !== '')) // Filtrar linhas vazias
        .map(row => {
          const obj = {};
          normalizedHeaders.forEach((header, index) => {
            if (header) {
              obj[header] = this.normalizeValue(row[index], header);
            }
          });
          return obj;
        })
        .filter(obj => Object.keys(obj).length > 0);

      return {
        fileName: path.basename(filePath),
        headers: normalizedHeaders,
        data: processedData,
        totalRecords: processedData.length
      };

    } catch (error) {
      console.error(`Erro ao processar arquivo XLSX ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Normaliza os headers das colunas
   */
  normalizeHeaders(headers) {
    return headers.map(header => {
      if (!header || typeof header !== 'string') return null;
      
      const normalized = header.toString()
        .trim()
        .toUpperCase()
        .replace(/[^\w\s]/g, '') // Remove caracteres especiais
        .replace(/\s+/g, '_'); // Substitui espaços por underscore

      // Mapeamento de headers conhecidos para padrões
      const headerMap = {
        'COD_ITEM': 'CODIGO_ITEM',
        'CODIGO': 'CODIGO_ITEM',
        'ITEM': 'CODIGO_ITEM',
        'DESCRICAO': 'DESCRICAO_ITEM',
        'DESCRICAO_DO_ITEM': 'DESCRICAO_ITEM',
        'NOME': 'DESCRICAO_ITEM',
        'UNIDADE': 'UNIDADE_MEDIDA',
        'UND': 'UNIDADE_MEDIDA',
        'QTDE': 'QUANTIDADE',
        'QUANTIDADE': 'QUANTIDADE',
        'QTD': 'QUANTIDADE',
        'VALOR_UNITARIO': 'VALOR_UNITARIO',
        'VLR_UNIT': 'VALOR_UNITARIO',
        'PRECO': 'VALOR_UNITARIO',
        'VALOR_TOTAL': 'VALOR_TOTAL',
        'VLR_TOTAL': 'VALOR_TOTAL',
        'TOTAL': 'VALOR_TOTAL',
        'DATA': 'DATA',
        'DT': 'DATA',
        'ENTRADA': 'ENTRADA',
        'SAIDA': 'SAIDA',
        'ESTOQUE': 'ESTOQUE',
        'SALDO': 'ESTOQUE'
      };

      return headerMap[normalized] || normalized;
    });
  }

  /**
   * Normaliza valores baseado no tipo de coluna
   */
  normalizeValue(value, header) {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    // Conversões específicas por tipo de header
    switch (header) {
      case 'CODIGO_ITEM':
        return value.toString().trim();
      
      case 'QUANTIDADE':
      case 'ENTRADA':
      case 'SAIDA':
      case 'ESTOQUE':
        return this.parseNumber(value);
      
      case 'VALOR_UNITARIO':
      case 'VALOR_TOTAL':
        return this.parseCurrency(value);
      
      case 'DATA':
        return this.parseDate(value);
      
      default:
        return value.toString().trim();
    }
  }

  /**
   * Converte valor para número
   */
  parseNumber(value) {
    if (typeof value === 'number') return value;
    
    const numStr = value.toString()
      .replace(/[^\d,.-]/g, '') // Remove caracteres não numéricos exceto vírgula, ponto e hífen
      .replace(',', '.'); // Substitui vírgula por ponto
    
    const num = parseFloat(numStr);
    return isNaN(num) ? 0 : num;
  }

  /**
   * Converte valor monetário
   */
  parseCurrency(value) {
    if (typeof value === 'number') return value;
    
    const currencyStr = value.toString()
      .replace(/[^\d,.-]/g, '') // Remove símbolos de moeda
      .replace(',', '.'); // Substitui vírgula por ponto
    
    const num = parseFloat(currencyStr);
    return isNaN(num) ? 0 : num;
  }

  /**
   * Converte data para formato ISO
   */
  parseDate(value) {
    if (!value) return null;
    
    // Se já for um objeto Date
    if (value instanceof Date) {
      return value.toISOString().split('T')[0];
    }
    
    // Se for número (data Excel)
    if (typeof value === 'number') {
      const date = new Date(Math.round((value - 25569) * 86400 * 1000));
      return date.toISOString().split('T')[0];
    }
    
    // Se for string, tentar parsear
    const dateStr = value.toString().trim();
    const date = new Date(dateStr);
    
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
    
    return dateStr; // Retorna string original se não conseguir converter
  }

  /**
   * Identifica a unidade baseada no nome do arquivo
   */
  identifyUnit(fileName) {
    const upperFileName = fileName.toUpperCase();
    
    for (const unit of this.units) {
      if (upperFileName.includes(unit.toUpperCase())) {
        return unit;
      }
    }
    
    return 'UNKNOWN';
  }

  /**
   * Identifica o tipo de arquivo (Balancete ou Movimentação)
   */
  identifyFileType(fileName) {
    const upperFileName = fileName.toUpperCase();
    
    if (upperFileName.includes('BALANCETE')) {
      return 'Balancete';
    } else if (upperFileName.includes('MOVIMENTACAO') || upperFileName.includes('MOVIMENTAÇÃO')) {
      return 'Movimentacao';
    }
    
    return 'UNKNOWN';
  }

  /**
   * Processa todos os arquivos XLSX na pasta input
   */
  async processAllXLSXFiles() {
    try {
      const files = fs.readdirSync(this.inputDir);
      const xlsxFiles = files.filter(file => file.toLowerCase().endsWith('.xlsx'));
      
      const results = {};
      
      for (const unit of this.units) {
        results[unit] = {
          Balancete: null,
          Movimentacao: null
        };
      }

      for (const file of xlsxFiles) {
        const filePath = path.join(this.inputDir, file);
        const unit = this.identifyUnit(file);
        const fileType = this.identifyFileType(file);
        
        if (unit !== 'UNKNOWN' && fileType !== 'UNKNOWN') {
          console.log(`Processando: ${file} -> ${unit}/${fileType}`);
          
          try {
            const processedData = await this.processXLSXFile(filePath);
            results[unit][fileType] = processedData;
          } catch (error) {
            console.error(`Erro ao processar ${file}:`, error.message);
          }
        }
      }

      return results;
    } catch (error) {
      console.error('Erro ao processar arquivos:', error);
      throw error;
    }
  }

  /**
   * Salva os resultados em arquivos JSON separados por unidade
   */
  async saveResults(results) {
    for (const unit of this.units) {
      if (results[unit]) {
        const outputPath = path.join(this.outputDir, `${unit}_data.json`);
        
        // Adicionar metadados
        const output = {
          unit: unit,
          processedAt: new Date().toISOString(),
          files: {
            balancete: results[unit].Balancete ? {
              fileName: results[unit].Balancete.fileName,
              totalRecords: results[unit].Balancete.totalRecords,
              headers: results[unit].Balancete.headers,
              data: results[unit].Balancete.data
            } : null,
            movimentacao: results[unit].Movimentacao ? {
              fileName: results[unit].Movimentacao.fileName,
              totalRecords: results[unit].Movimentacao.totalRecords,
              headers: results[unit].Movimentacao.headers,
              data: results[unit].Movimentacao.data
            } : null
          }
        };

        fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf8');
        console.log(`Dados salvos em: ${outputPath}`);
      }
    }
  }

  /**
   * Executa o processamento completo
   */
  async run() {
    console.log('Iniciando processamento dos arquivos da Matriciale...');
    
    try {
      const results = await this.processAllXLSXFiles();
      await this.saveResults(results);
      
      console.log('Processamento concluído com sucesso!');
      return results;
    } catch (error) {
      console.error('Erro no processamento:', error);
      throw error;
    }
  }
}

export default MatricialeFileProcessor; 