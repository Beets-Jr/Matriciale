import fs from 'fs';
import path from 'path';

/**
 * Processador específico para arquivos PDF da Matriciale
 * Extrai dados estruturados de relatórios PDF
 */
class MatricialePDFProcessor {
  constructor() {
    this.inputDir = path.join(process.cwd(), 'src/data/input');
    this.outputDir = path.join(process.cwd(), 'src/data/output');
    this.units = ['CAF', 'ESF3', 'Olavo'];
  }

  /**
   * Processa um arquivo PDF e extrai dados estruturados
   */
  async processPDFFile(filePath) {
    try {
      // Importação dinâmica da biblioteca pdf-parse
      const pdfParse = (await import('pdf-parse')).default;
      
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      
      // Analisar o texto extraído
      const text = data.text;
      const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      
      // Identificar tipo de relatório
      const reportType = this.identifyReportType(text);
      
      // Extrair dados baseado no tipo
      let extractedData = [];
      if (reportType === 'Balancete') {
        extractedData = this.extractBalanceteData(lines);
      } else if (reportType === 'Movimentacao') {
        extractedData = this.extractMovimentacaoData(lines);
      }

      return {
        fileName: path.basename(filePath),
        reportType: reportType,
        totalPages: data.numpages,
        extractedText: text.substring(0, 1000), // Primeiros 1000 caracteres para debug
        data: extractedData,
        totalRecords: extractedData.length
      };

    } catch (error) {
      console.error(`Erro ao processar PDF ${filePath}:`, error);
      
      // Retornar resultado vazio em caso de erro
      return {
        fileName: path.basename(filePath),
        reportType: 'UNKNOWN',
        totalPages: 0,
        extractedText: `Erro ao processar: ${error.message}`,
        data: [],
        totalRecords: 0,
        error: error.message
      };
    }
  }

  /**
   * Identifica o tipo de relatório baseado no conteúdo
   */
  identifyReportType(text) {
    const upperText = text.toUpperCase();
    
    if (upperText.includes('BALANCETE') || upperText.includes('BALANÇO')) {
      return 'Balancete';
    } else if (upperText.includes('MOVIMENTAÇÃO') || upperText.includes('MOVIMENTACAO')) {
      return 'Movimentacao';
    }
    
    return 'UNKNOWN';
  }

  /**
   * Extrai dados de balancete do PDF
   */
  extractBalanceteData(lines) {
    const data = [];
    let inDataSection = false;
    let headers = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Procurar por cabeçalhos de tabela
      if (this.isTableHeader(line)) {
        headers = this.parseTableHeader(line);
        inDataSection = true;
        continue;
      }

      // Se estamos na seção de dados e a linha parece ser uma linha de dados
      if (inDataSection && this.isDataRow(line)) {
        const rowData = this.parseDataRow(line, headers);
        if (rowData && Object.keys(rowData).length > 0) {
          data.push(rowData);
        }
      }

      // Parar se encontrarmos uma seção de totais ou fim de tabela
      if (line.includes('TOTAL') && line.includes('R$')) {
        inDataSection = false;
      }
    }

    return data;
  }

  /**
   * Extrai dados de movimentação do PDF
   */
  extractMovimentacaoData(lines) {
    const data = [];
    let inDataSection = false;
    let headers = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Lógica similar ao balancete mas adaptada para movimentação
      if (this.isTableHeader(line)) {
        headers = this.parseTableHeader(line);
        inDataSection = true;
        continue;
      }

      if (inDataSection && this.isDataRow(line)) {
        const rowData = this.parseDataRow(line, headers);
        if (rowData && Object.keys(rowData).length > 0) {
          data.push(rowData);
        }
      }

      if (line.includes('TOTAL') && line.includes('R$')) {
        inDataSection = false;
      }
    }

    return data;
  }

  /**
   * Verifica se uma linha é um cabeçalho de tabela
   */
  isTableHeader(line) {
    const upperLine = line.toUpperCase();
    
    // Palavras-chave que indicam cabeçalhos
    const headerKeywords = [
      'CÓDIGO', 'CODIGO', 'ITEM', 'DESCRIÇÃO', 'DESCRICAO',
      'QUANTIDADE', 'QTDE', 'QTD', 'UNIDADE', 'UND',
      'VALOR', 'PREÇO', 'PRECO', 'TOTAL', 'DATA'
    ];

    const keywordCount = headerKeywords.filter(keyword => 
      upperLine.includes(keyword)
    ).length;

    return keywordCount >= 3; // Pelo menos 3 palavras-chave de cabeçalho
  }

  /**
   * Faz parsing do cabeçalho da tabela
   */
  parseTableHeader(line) {
    // Dividir a linha em colunas baseado em espaçamento
    const columns = line.split(/\s{2,}/).map(col => col.trim());
    
    // Normalizar headers
    return columns.map(header => {
      const normalized = header.toUpperCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, '_');

      // Mapeamento similar ao processador XLSX
      const headerMap = {
        'CODIGO': 'CODIGO_ITEM',
        'ITEM': 'CODIGO_ITEM',
        'DESCRICAO': 'DESCRICAO_ITEM',
        'QUANTIDADE': 'QUANTIDADE',
        'QTDE': 'QUANTIDADE',
        'QTD': 'QUANTIDADE',
        'UNIDADE': 'UNIDADE_MEDIDA',
        'UND': 'UNIDADE_MEDIDA',
        'VALOR_UNITARIO': 'VALOR_UNITARIO',
        'VALOR_UNIT': 'VALOR_UNITARIO',
        'PRECO': 'VALOR_UNITARIO',
        'VALOR_TOTAL': 'VALOR_TOTAL',
        'TOTAL': 'VALOR_TOTAL',
        'DATA': 'DATA'
      };

      return headerMap[normalized] || normalized;
    });
  }

  /**
   * Verifica se uma linha é uma linha de dados
   */
  isDataRow(line) {
    // Uma linha de dados geralmente tem:
    // - Números (códigos, quantidades, valores)
    // - Pelo menos uma palavra (descrição)
    // - Não é uma linha de cabeçalho ou total
    
    const hasNumbers = /\d/.test(line);
    const hasLetters = /[a-zA-Z]/.test(line);
    const isNotTotal = !line.toUpperCase().includes('TOTAL GERAL');
    const isNotHeader = !this.isTableHeader(line);
    
    return hasNumbers && hasLetters && isNotTotal && isNotHeader && line.length > 10;
  }

  /**
   * Faz parsing de uma linha de dados
   */
  parseDataRow(line, headers) {
    if (!headers || headers.length === 0) return null;

    // Dividir a linha tentando preservar a estrutura de colunas
    const parts = line.split(/\s{2,}/).map(part => part.trim());
    
    const rowData = {};
    
    // Mapear cada parte para um header
    for (let i = 0; i < Math.min(parts.length, headers.length); i++) {
      const header = headers[i];
      const value = parts[i];
      
      if (header && value) {
        rowData[header] = this.normalizeValue(value, header);
      }
    }

    return rowData;
  }

  /**
   * Normaliza valores extraídos do PDF
   */
  normalizeValue(value, header) {
    if (!value || value.trim() === '') return null;

    const trimmedValue = value.trim();

    switch (header) {
      case 'CODIGO_ITEM':
        return trimmedValue;
      
      case 'QUANTIDADE':
      case 'ESTOQUE':
        return this.parseNumber(trimmedValue);
      
      case 'VALOR_UNITARIO':
      case 'VALOR_TOTAL':
        return this.parseCurrency(trimmedValue);
      
      case 'DATA':
        return this.parseDate(trimmedValue);
      
      default:
        return trimmedValue;
    }
  }

  /**
   * Converte string para número
   */
  parseNumber(value) {
    const numStr = value.replace(/[^\d,.-]/g, '').replace(',', '.');
    const num = parseFloat(numStr);
    return isNaN(num) ? 0 : num;
  }

  /**
   * Converte string para valor monetário
   */
  parseCurrency(value) {
    // Remove símbolos de moeda e formata
    const currencyStr = value
      .replace(/R\$/, '')
      .replace(/[^\d,.-]/g, '')
      .replace(',', '.');
    
    const num = parseFloat(currencyStr);
    return isNaN(num) ? 0 : num;
  }

  /**
   * Converte string para data
   */
  parseDate(value) {
    // Tentar diferentes formatos de data
    const dateFormats = [
      /(\d{2})\/(\d{2})\/(\d{4})/, // DD/MM/YYYY
      /(\d{2})-(\d{2})-(\d{4})/, // DD-MM-YYYY
      /(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
    ];

    for (const format of dateFormats) {
      const match = value.match(format);
      if (match) {
        const [, day, month, year] = match;
        const date = new Date(year, month - 1, day);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      }
    }

    return value; // Retorna valor original se não conseguir parsear
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
   * Processa todos os arquivos PDF na pasta input
   */
  async processAllPDFFiles() {
    try {
      const files = fs.readdirSync(this.inputDir);
      const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'));
      
      const results = {};
      
      for (const unit of this.units) {
        results[unit] = [];
      }

      for (const file of pdfFiles) {
        const filePath = path.join(this.inputDir, file);
        const unit = this.identifyUnit(file);
        
        if (unit !== 'UNKNOWN') {
          console.log(`Processando PDF: ${file} -> ${unit}`);
          
          try {
            const processedData = await this.processPDFFile(filePath);
            results[unit].push(processedData);
          } catch (error) {
            console.error(`Erro ao processar PDF ${file}:`, error.message);
          }
        }
      }

      return results;
    } catch (error) {
      console.error('Erro ao processar PDFs:', error);
      throw error;
    }
  }

  /**
   * Salva os resultados dos PDFs
   */
  async savePDFResults(results) {
    for (const unit of this.units) {
      if (results[unit] && results[unit].length > 0) {
        const outputPath = path.join(this.outputDir, `${unit}_pdf_data.json`);
        
        const output = {
          unit: unit,
          processedAt: new Date().toISOString(),
          pdfFiles: results[unit]
        };

        fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf8');
        console.log(`Dados PDF salvos em: ${outputPath}`);
      }
    }
  }
}

export default MatricialePDFProcessor; 