import MatricialeFileProcessor from './fileProcessor.js';
import MatricialePDFProcessor from './pdfProcessor.cjs';
import fs from 'fs';
import path from 'path';

/**
 * Processador principal da Matriciale
 * Coordena o processamento de arquivos XLSX e PDF
 * Gera relatórios completos por unidade
 */
class MatricialeMainProcessor {
  constructor() {
    this.xlsxProcessor = new MatricialeFileProcessor();
    this.pdfProcessor = new MatricialePDFProcessor();
    this.outputDir = path.join(process.cwd(), 'src/data/output');
    this.units = ['CAF', 'ESF3', 'Olavo'];
    
    // Garantir que o diretório output existe
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Executa o processamento completo de todos os arquivos
   */
  async processAll() {
    console.log('🚀 Iniciando processamento completo da Matriciale...\n');
    
    try {
      // Processar arquivos XLSX
      console.log('📊 Processando arquivos XLSX...');
      const xlsxResults = await this.xlsxProcessor.processAllXLSXFiles();
      await this.xlsxProcessor.saveResults(xlsxResults);
      console.log('✅ Arquivos XLSX processados com sucesso!\n');

      // Processar arquivos PDF
      console.log('📄 Processando arquivos PDF...');
      const pdfResults = await this.pdfProcessor.processAllPDFFiles();
      await this.pdfProcessor.savePDFResults(pdfResults);
      console.log('✅ Arquivos PDF processados com sucesso!\n');

      // Consolidar resultados
      console.log('🔄 Consolidando resultados...');
      const consolidatedResults = this.consolidateResults(xlsxResults, pdfResults);
      await this.saveConsolidatedResults(consolidatedResults);
      console.log('✅ Resultados consolidados!\n');

      // Gerar relatório de processamento
      await this.generateProcessingReport(xlsxResults, pdfResults, consolidatedResults);
      
      console.log('🎉 Processamento completo finalizado com sucesso!');
      
      return consolidatedResults;

    } catch (error) {
      console.error('❌ Erro no processamento:', error);
      throw error;
    }
  }

  /**
   * Consolida resultados de XLSX e PDF por unidade
   */
  consolidateResults(xlsxResults, pdfResults) {
    const consolidated = {};

    for (const unit of this.units) {
      consolidated[unit] = {
        unit: unit,
        processedAt: new Date().toISOString(),
        xlsx: {
          balancete: xlsxResults[unit]?.Balancete || null,
          movimentacao: xlsxResults[unit]?.Movimentacao || null
        },
        pdf: {
          files: pdfResults[unit] || []
        },
        summary: {
          totalXLSXRecords: this.countXLSXRecords(xlsxResults[unit]),
          totalPDFFiles: pdfResults[unit]?.length || 0,
          totalPDFRecords: this.countPDFRecords(pdfResults[unit])
        }
      };
    }

    return consolidated;
  }

  /**
   * Conta registros nos arquivos XLSX de uma unidade
   */
  countXLSXRecords(unitData) {
    if (!unitData) return 0;
    
    let total = 0;
    if (unitData.Balancete) total += unitData.Balancete.totalRecords || 0;
    if (unitData.Movimentacao) total += unitData.Movimentacao.totalRecords || 0;
    
    return total;
  }

  /**
   * Conta registros nos arquivos PDF de uma unidade
   */
  countPDFRecords(unitPDFs) {
    if (!unitPDFs || !Array.isArray(unitPDFs)) return 0;
    
    return unitPDFs.reduce((total, pdf) => total + (pdf.totalRecords || 0), 0);
  }

  /**
   * Salva os resultados consolidados
   */
  async saveConsolidatedResults(consolidatedResults) {
    for (const unit of this.units) {
      const outputPath = path.join(this.outputDir, `${unit}_consolidated.json`);
      
      fs.writeFileSync(
        outputPath, 
        JSON.stringify(consolidatedResults[unit], null, 2), 
        'utf8'
      );
      
      console.log(`📁 Dados consolidados de ${unit} salvos em: ${outputPath}`);
    }

    // Salvar um arquivo com todos os dados
    const allDataPath = path.join(this.outputDir, 'matriciale_all_data.json');
    fs.writeFileSync(
      allDataPath, 
      JSON.stringify(consolidatedResults, null, 2), 
      'utf8'
    );
    
    console.log(`📁 Todos os dados salvos em: ${allDataPath}`);
  }

  /**
   * Gera relatório de processamento
   */
  async generateProcessingReport(xlsxResults, pdfResults, consolidatedResults) {
    const report = {
      processedAt: new Date().toISOString(),
      summary: {
        totalUnits: this.units.length,
        processedUnits: Object.keys(consolidatedResults).length,
        totalFiles: this.countTotalFiles(xlsxResults, pdfResults),
        totalRecords: this.countTotalRecords(consolidatedResults)
      },
      unitDetails: {},
      files: {
        xlsx: this.getXLSXFilesSummary(xlsxResults),
        pdf: this.getPDFFilesSummary(pdfResults)
      },
      errors: [] // Poderia ser preenchido com erros encontrados
    };

    // Detalhes por unidade
    for (const unit of this.units) {
      report.unitDetails[unit] = {
        xlsxFiles: {
          balancete: xlsxResults[unit]?.Balancete?.fileName || null,
          movimentacao: xlsxResults[unit]?.Movimentacao?.fileName || null
        },
        pdfFiles: pdfResults[unit]?.map(pdf => pdf.fileName) || [],
        totalRecords: consolidatedResults[unit]?.summary?.totalXLSXRecords + 
                      consolidatedResults[unit]?.summary?.totalPDFRecords || 0
      };
    }

    const reportPath = path.join(this.outputDir, 'processing_report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
    
    console.log(`📋 Relatório de processamento salvo em: ${reportPath}`);
    
    // Imprimir resumo no console
    this.printProcessingSummary(report);
  }

  /**
   * Conta total de arquivos processados
   */
  countTotalFiles(xlsxResults, pdfResults) {
    let xlsxCount = 0;
    let pdfCount = 0;

    for (const unit of this.units) {
      if (xlsxResults[unit]?.Balancete) xlsxCount++;
      if (xlsxResults[unit]?.Movimentacao) xlsxCount++;
      
      if (pdfResults[unit]) {
        pdfCount += pdfResults[unit].length;
      }
    }

    return xlsxCount + pdfCount;
  }

  /**
   * Conta total de registros
   */
  countTotalRecords(consolidatedResults) {
    let total = 0;
    
    for (const unit of this.units) {
      const unitData = consolidatedResults[unit];
      if (unitData?.summary) {
        total += unitData.summary.totalXLSXRecords + unitData.summary.totalPDFRecords;
      }
    }

    return total;
  }

  /**
   * Gera resumo dos arquivos XLSX
   */
  getXLSXFilesSummary(xlsxResults) {
    const summary = [];
    
    for (const unit of this.units) {
      if (xlsxResults[unit]?.Balancete) {
        summary.push({
          unit: unit,
          type: 'Balancete',
          fileName: xlsxResults[unit].Balancete.fileName,
          records: xlsxResults[unit].Balancete.totalRecords
        });
      }
      
      if (xlsxResults[unit]?.Movimentacao) {
        summary.push({
          unit: unit,
          type: 'Movimentacao',
          fileName: xlsxResults[unit].Movimentacao.fileName,
          records: xlsxResults[unit].Movimentacao.totalRecords
        });
      }
    }

    return summary;
  }

  /**
   * Gera resumo dos arquivos PDF
   */
  getPDFFilesSummary(pdfResults) {
    const summary = [];
    
    for (const unit of this.units) {
      if (pdfResults[unit]) {
        pdfResults[unit].forEach(pdf => {
          summary.push({
            unit: unit,
            type: pdf.reportType,
            fileName: pdf.fileName,
            records: pdf.totalRecords,
            pages: pdf.totalPages
          });
        });
      }
    }

    return summary;
  }

  /**
   * Imprime resumo do processamento no console
   */
  printProcessingSummary(report) {
    console.log('\n📊 RESUMO DO PROCESSAMENTO');
    console.log('='.repeat(50));
    console.log(`📅 Data/Hora: ${report.processedAt}`);
    console.log(`🏢 Unidades: ${report.summary.totalUnits}`);
    console.log(`📁 Arquivos: ${report.summary.totalFiles}`);
    console.log(`📋 Registros: ${report.summary.totalRecords}`);
    console.log('\n📋 POR UNIDADE:');
    
    for (const unit of this.units) {
      const details = report.unitDetails[unit];
      console.log(`\n${unit}:`);
      console.log(`  📊 XLSX: ${details.xlsxFiles.balancete ? '✅' : '❌'} Balancete, ${details.xlsxFiles.movimentacao ? '✅' : '❌'} Movimentação`);
      console.log(`  📄 PDF: ${details.pdfFiles.length} arquivo(s)`);
      console.log(`  📈 Total de registros: ${details.totalRecords}`);
    }
    
    console.log('\n' + '='.repeat(50));
  }

  /**
   * Método para executar apenas processamento de XLSX
   */
  async processXLSXOnly() {
    console.log('📊 Processando apenas arquivos XLSX...');
    return await this.xlsxProcessor.run();
  }

  /**
   * Método para executar apenas processamento de PDF
   */
  async processPDFOnly() {
    console.log('📄 Processando apenas arquivos PDF...');
    const results = await this.pdfProcessor.processAllPDFFiles();
    await this.pdfProcessor.savePDFResults(results);
    return results;
  }
}

export default MatricialeMainProcessor; 