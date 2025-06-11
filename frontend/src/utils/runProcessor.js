#!/usr/bin/env node

import MatricialeMainProcessor from './matricialeProcessor.js';

/**
 * Script executável para processar arquivos da Matriciale
 * 
 * Uso:
 * node runProcessor.js [opção]
 * 
 * Opções:
 * - all (padrão): Processa XLSX e PDF
 * - xlsx: Processa apenas arquivos XLSX
 * - pdf: Processa apenas arquivos PDF
 */

async function main() {
  const args = process.argv.slice(2);
  const option = args[0] || 'all';
  
  const processor = new MatricialeMainProcessor();
  
  try {
    console.log('🏥 PROCESSADOR DE ARQUIVOS MATRICIALE');
    console.log('=' .repeat(50));
    console.log(`Opção selecionada: ${option.toUpperCase()}\n`);

    let results;
    
    switch (option.toLowerCase()) {
      case 'xlsx':
        results = await processor.processXLSXOnly();
        break;
        
      case 'pdf':
        results = await processor.processPDFOnly();
        break;
        
      case 'all':
      default:
        results = await processor.processAll();
        break;
    }

    console.log('\n✨ Processamento finalizado com sucesso!');
    console.log('\n📁 Arquivos gerados na pasta: src/data/output/');
    console.log('\n📋 Estrutura dos outputs:');
    console.log('  - [UNIDADE]_data.json (dados XLSX)');
    console.log('  - [UNIDADE]_pdf_data.json (dados PDF)');
    console.log('  - [UNIDADE]_consolidated.json (dados consolidados)');
    console.log('  - matriciale_all_data.json (todos os dados)');
    console.log('  - processing_report.json (relatório de processamento)');

  } catch (error) {
    console.error('\n❌ Erro durante o processamento:', error.message);
    console.error('\n🔍 Detalhes do erro:', error);
    process.exit(1);
  }
}

// Verificar se o script está sendo executado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main }; 