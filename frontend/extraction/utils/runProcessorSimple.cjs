const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

/**
 * Processador simplificado para arquivos XLSX da Matriciale
 */
class SimpleMatricialeProcessor {
  constructor() {
    this.inputDir = path.join(process.cwd(), 'src/data/input');
    this.outputDir = path.join(process.cwd(), 'src/data/output');
    this.units = ['CAF', 'ESF3', 'Olavo'];
    
    // Garantir que o diretório output existe
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Processa um arquivo XLSX
   */
  processXLSXFile(filePath) {
    try {
      console.log(`📊 Processando: ${path.basename(filePath)}`);
      
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Extrair dados como JSON
      const data = XLSX.utils.sheet_to_json(worksheet, {
        header: 1, // Array de arrays
        defval: ''
      });

      // Encontrar linha de cabeçalho
      let headerRowIndex = -1;
      for (let i = 0; i < data.length; i++) {
        if (data[i] && data[i].length > 3) {
          headerRowIndex = i;
          break;
        }
      }

      if (headerRowIndex === -1) {
        throw new Error('Cabeçalho não encontrado');
      }

      const headers = data[headerRowIndex];
      const dataRows = data.slice(headerRowIndex + 1);
      
      // Converter para objetos
      const processedData = dataRows
        .filter(row => row && row.some(cell => cell !== ''))
        .map(row => {
          const obj = {};
          headers.forEach((header, index) => {
            if (header && row[index] !== undefined) {
              obj[header] = row[index];
            }
          });
          return obj;
        })
        .filter(obj => Object.keys(obj).length > 0);

      console.log(`✅ Extraídos ${processedData.length} registros`);

      return {
        fileName: path.basename(filePath),
        headers: headers,
        data: processedData,
        totalRecords: processedData.length
      };

    } catch (error) {
      console.error(`❌ Erro ao processar ${filePath}:`, error.message);
      throw error;
    }
  }

  /**
   * Identifica a unidade do arquivo
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
   * Identifica o tipo de arquivo
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
   * Processa todos os arquivos XLSX
   */
  processAllFiles() {
    console.log('🚀 Iniciando processamento de arquivos XLSX...\n');
    
    try {
      const files = fs.readdirSync(this.inputDir);
      const xlsxFiles = files.filter(file => file.toLowerCase().endsWith('.xlsx'));
      
      console.log(`📁 Encontrados ${xlsxFiles.length} arquivos XLSX:`);
      xlsxFiles.forEach(file => console.log(`  - ${file}`));
      console.log('');

      const results = {};
      
      // Inicializar estrutura
      for (const unit of this.units) {
        results[unit] = {
          Balancete: null,
          Movimentacao: null
        };
      }

      // Processar cada arquivo
      for (const file of xlsxFiles) {
        const filePath = path.join(this.inputDir, file);
        const unit = this.identifyUnit(file);
        const fileType = this.identifyFileType(file);
        
        console.log(`🔍 ${file} -> Unidade: ${unit}, Tipo: ${fileType}`);
        
        if (unit !== 'UNKNOWN' && fileType !== 'UNKNOWN') {
          try {
            const processedData = this.processXLSXFile(filePath);
            results[unit][fileType] = processedData;
          } catch (error) {
            console.error(`❌ Falha ao processar ${file}: ${error.message}`);
          }
        } else {
          console.warn(`⚠️  Arquivo ignorado: ${file} (unidade ou tipo não identificado)`);
        }
        
        console.log('');
      }

      return results;

    } catch (error) {
      console.error('❌ Erro geral no processamento:', error);
      throw error;
    }
  }

  /**
   * Salva os resultados
   */
  saveResults(results) {
    console.log('💾 Salvando resultados...\n');

    for (const unit of this.units) {
      if (results[unit] && (results[unit].Balancete || results[unit].Movimentacao)) {
        const outputPath = path.join(this.outputDir, `${unit}_data.json`);
        
        const output = {
          unit: unit,
          processedAt: new Date().toISOString(),
          files: {
            balancete: results[unit].Balancete,
            movimentacao: results[unit].Movimentacao
          }
        };

        fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf8');
        console.log(`📁 ${unit}: ${outputPath}`);
      }
    }

    // Salvar arquivo consolidado
    const allDataPath = path.join(this.outputDir, 'matriciale_all_data.json');
    fs.writeFileSync(allDataPath, JSON.stringify(results, null, 2), 'utf8');
    console.log(`📁 Todos os dados: ${allDataPath}`);
  }

  /**
   * Imprime resumo
   */
  printSummary(results) {
    console.log('\n📊 RESUMO DO PROCESSAMENTO');
    console.log('='.repeat(50));
    
    let totalFiles = 0;
    let totalRecords = 0;

    for (const unit of this.units) {
      console.log(`\n${unit}:`);
      
      if (results[unit].Balancete) {
        console.log(`  ✅ Balancete: ${results[unit].Balancete.totalRecords} registros`);
        totalFiles++;
        totalRecords += results[unit].Balancete.totalRecords;
      } else {
        console.log(`  ❌ Balancete: não encontrado`);
      }
      
      if (results[unit].Movimentacao) {
        console.log(`  ✅ Movimentação: ${results[unit].Movimentacao.totalRecords} registros`);
        totalFiles++;
        totalRecords += results[unit].Movimentacao.totalRecords;
      } else {
        console.log(`  ❌ Movimentação: não encontrado`);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`📁 Total de arquivos processados: ${totalFiles}`);
    console.log(`📋 Total de registros extraídos: ${totalRecords}`);
    console.log(`📅 Processado em: ${new Date().toLocaleString('pt-BR')}`);
  }

  /**
   * Executa o processamento completo
   */
  run() {
    try {
      const results = this.processAllFiles();
      this.saveResults(results);
      this.printSummary(results);
      
      console.log('\n🎉 Processamento concluído com sucesso!');
      console.log(`📁 Arquivos salvos em: ${this.outputDir}`);
      
      return results;
      
    } catch (error) {
      console.error('\n💥 Erro no processamento:', error);
      throw error;
    }
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const processor = new SimpleMatricialeProcessor();
  processor.run();
}

module.exports = SimpleMatricialeProcessor; 