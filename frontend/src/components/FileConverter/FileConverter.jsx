import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import moment from 'moment';
import './FileConverter.css';

const FileConverter = () => {
  const [jsonOutput, setJsonOutput] = useState('');
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const parseExcelDate = (excelDate) => {
    const date = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Função para extrair dados específicos do PDF de Relatório de Movimentação
  const extractMovimentacaoFromPDF = (pdfText) => {
    const lines = pdfText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    let prefeitura = '';
    let relatorio = '';
    const paginas = [];
    
    let currentPage = null;
    let currentProduto = null;
    let currentMovimentacao = [];
    let pageNumber = 0;

    // Função auxiliar para limpar e formatar números
    const parseNumber = (str) => {
      if (!str) return null;
      
      // Converter para string se não for
      const strValue = str.toString().trim();
      
      // Remover tudo exceto números, pontos e vírgulas
      const cleaned = strValue.replace(/[^\d.,]/g, '');
      if (cleaned === '') return null;
      
      // Se tem pontos como separador de milhares (formato brasileiro)
      if (cleaned.match(/^\d{1,3}(\.\d{3})+$/)) {
        return parseInt(cleaned.replace(/\./g, ''));
      }
      
      // Se tem vírgula como decimal (formato brasileiro)
      if (cleaned.match(/^\d+,\d{1,2}$/)) {
        return parseFloat(cleaned.replace(',', '.'));
      }
      
      // Se tem pontos e vírgula (formato brasileiro completo: 1.000,50)
      if (cleaned.includes('.') && cleaned.includes(',')) {
        return parseFloat(cleaned.replace(/\./g, '').replace(',', '.'));
      }
      
      // Se só tem vírgula, verificar se é decimal ou milhares
      if (cleaned.includes(',')) {
        const parts = cleaned.split(',');
        if (parts.length === 2 && parts[1].length <= 2) {
          // Decimal: 10,50
          return parseFloat(cleaned.replace(',', '.'));
        } else {
          // Milhares: 1,000
          return parseInt(cleaned.replace(/,/g, ''));
        }
      }
      
      // Se só tem números ou pontos (milhares americanos)
      if (cleaned.includes('.')) {
        // Se termina com .XX pode ser decimal americano
        if (cleaned.match(/\.\d{1,2}$/)) {
          return parseFloat(cleaned);
        }
        // Senão, tratar como milhares
        return parseInt(cleaned.replace(/\./g, ''));
      }
      
      // Só números
      return parseInt(cleaned);
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Extrair informações do cabeçalho
      if (line.toUpperCase().includes('PREFEITURA MUNICIPAL')) {
        const match = line.match(/PREFEITURA MUNICIPAL DE (.+)/i);
        if (match) {
          prefeitura = match[1].trim();
        } else {
          // Tentar extrair o nome da próxima linha
          const nextLines = lines.slice(i + 1, i + 3);
          for (const nextLine of nextLines) {
            if (nextLine && !nextLine.includes('Relatório') && nextLine.length > 3) {
              prefeitura = nextLine.trim();
              break;
            }
          }
        }
      }
      
      if (line.includes('Relatório de Movimentação de Estoque')) {
        // Procurar informação de período nas próximas linhas
        for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
          const nextLine = lines[j];
          if (nextLine && (nextLine.includes('até') || nextLine.includes('de ') && nextLine.includes('/'))) {
            relatorio = nextLine.trim();
            break;
          }
        }
      }
      
      // Detectar início de nova página de forma mais robusta
      if (line.match(/Página\s*(\d+)/i)) {
        // Salvar página anterior se existir
        if (currentPage && currentProduto) {
          currentPage.Movimentacao = currentMovimentacao;
          paginas.push(currentPage);
        }
        
        const pageMatch = line.match(/Página\s*(\d+)/i);
        if (pageMatch) {
          pageNumber = parseInt(pageMatch[1]);
          currentPage = { Página: pageNumber };
          currentMovimentacao = [];
          currentProduto = null;
          
          console.log(`📄 Página ${pageNumber} detectada`);
        }
      }
      
      // Detectar produtos de forma mais precisa
      // Primeiro, verificar se a linha contém um código de produto
      const codigoNaLinha = line.match(/(\d{3}\.\d{3}\.\d{3})/);
      
      if (codigoNaLinha) {
        let nomeProduto = '';
        let codigoProduto = codigoNaLinha[1];
        let unidade = '';
        
        // Limpar o nome removendo o código
        nomeProduto = line.replace(/\d{3}\.\d{3}\.\d{3}/, '').trim();
        
        // Se o nome ainda tem caracteres estranhos, procurar o nome real na linha anterior ou seguinte
        if (nomeProduto.length < 5 || !nomeProduto.includes(' ')) {
          // Procurar o nome nas linhas adjacentes
          for (let j = Math.max(0, i - 2); j < Math.min(i + 3, lines.length); j++) {
            if (j !== i) {
              const adjacentLine = lines[j];
              if (adjacentLine && adjacentLine.includes(' - ') && adjacentLine.length > 10) {
                const cleanName = adjacentLine.replace(/\d{3}\.\d{3}\.\d{3}/, '').trim();
                if (cleanName.length > nomeProduto.length) {
                  nomeProduto = cleanName;
                }
              }
            }
          }
        }
        
        // Extrair unidade da linha atual ou próximas
        const unidadeMatch = line.match(/\b(CP|AMP|ML|TB|ENV|FR|COMP|CAPS|BISNAGA|TUBO|FRASCO)\b/i);
        if (unidadeMatch) {
          unidade = unidadeMatch[1].toUpperCase();
        } else {
          // Procurar unidade nas linhas próximas
          for (let j = i; j < Math.min(i + 3, lines.length); j++) {
            const unidadeProxima = lines[j].match(/\b(CP|AMP|ML|TB|ENV|FR|COMP|CAPS|BISNAGA|TUBO|FRASCO)\b/i);
            if (unidadeProxima) {
              unidade = unidadeProxima[1].toUpperCase();
              break;
            }
          }
        }
        
        // Limpar nome final
        nomeProduto = nomeProduto.replace(/^\s*-\s*/, '').replace(/\s*-\s*$/, '').trim();
        
        currentProduto = {
          Nome: nomeProduto,
          CodigoProduto: codigoProduto,
          Unidade: unidade
        };
        
        if (currentPage) {
          currentPage.Produto = currentProduto;
        }
        
        console.log(`🔍 Produto detectado: ${nomeProduto} | Código: ${codigoProduto} | Unidade: ${unidade}`);
      }
      
      // Detectar linhas de movimentação (com data DD/MM/AAAA)
      const dataMatch = line.match(/^(\d{2}\/\d{2}\/\d{4})/);
      if (dataMatch && currentPage) {
        const data = dataMatch[1];
        
        // Extrair apenas o que vem logo após a data na mesma linha
        const restoDaLinha = line.substring(data.length).trim();
        
        let historico = '';
        let documento = null;
        let requisicao = null;
        let entrada = null;
        let saida = null;
        let estoque = null;
        let observacao = null;
        
        // Dividir de forma mais simples e precisa
        const partes = restoDaLinha.split(/\s+/);
        
        // Extrair histórico (primeiras palavras até encontrar um número ou documento)
        let historicoPartes = [];
        let j = 0;
        while (j < partes.length) {
          const parte = partes[j];
          // Parar se encontrar um documento (formato XXXXXXX/AAAA) ou número grande
          if (parte.match(/^\d{7}\/\d{4}$/) || parte.match(/^\d{3,}$/)) {
            break;
          }
          historicoPartes.push(parte);
          j++;
        }
        historico = historicoPartes.join(' ');
        
        // Procurar documento na linha
        const docMatch = line.match(/(\d{7}\/\d{4})/);
        if (docMatch) {
          documento = docMatch[1];
        }
        
        // Extrair números da linha de forma mais controlada
        const numerosNaLinha = line.match(/\b\d{1,6}(?:\.\d{3})*\b/g) || [];
        
        // Filtrar números que não são datas ou documentos
        const numerosLimpos = numerosNaLinha
          .filter(num => !num.includes('/'))
          .filter(num => !documento || !documento.includes(num))
          .map(num => parseNumber(num))
          .filter(num => num !== null && !isNaN(num));
        
        if (historico.toUpperCase().includes('SALDO ANTERIOR')) {
          saida = 0;
          if (numerosLimpos.length > 0) {
            estoque = numerosLimpos[numerosLimpos.length - 1]; // Último número é estoque
          }
        } else {
          if (numerosLimpos.length >= 2) {
            saida = numerosLimpos[numerosLimpos.length - 2]; // Penúltimo é saída
            estoque = numerosLimpos[numerosLimpos.length - 1]; // Último é estoque
          } else if (numerosLimpos.length === 1) {
            estoque = numerosLimpos[0];
          }
        }
        
        // Procurar observações nas linhas seguintes que contenham "Transferência"
        for (let k = i + 1; k < Math.min(i + 3, lines.length); k++) {
          const nextLine = lines[k];
          if (nextLine && nextLine.includes('Transferência') && nextLine.includes('nº')) {
            const obsMatch = nextLine.match(/(Transferência nº \d+)/);
            if (obsMatch) {
              observacao = obsMatch[1];
              break;
            }
          }
        }
        
        const movimentacao = {
          Data: data,
          Histórico: historico || 'N/A',
          Documento: documento,
          Requisição: requisicao,
          Movimento: {
            Entrada: entrada,
            Saída: saida
          },
          Estoque: estoque,
          Observação: observacao
        };
        
        console.log(`📊 Movimentação: ${data} | ${historico} | Saída: ${saida} | Estoque: ${estoque}`);
        currentMovimentacao.push(movimentacao);
      }
    }
    
    // Adicionar última página se existir
    if (currentPage && currentProduto) {
      currentPage.Movimentacao = currentMovimentacao;
      paginas.push(currentPage);
    }
    
    return {
      "PREFEITURA MUNICIPAL": prefeitura,
      "Relatório de Movimentação de Estoque": relatorio,
      "Paginas": paginas
    };
  };

  const handlePDFFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async function(e) {
        try {
          // Usar PDF.js que é mais adequado para o navegador
          const pdfjsLib = window.pdfjsLib;
          
          if (!pdfjsLib) {
            throw new Error('PDF.js não está carregado. Verifique se a biblioteca está incluída.');
          }
          
          const arrayBuffer = e.target.result;
          const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
          const pdf = await loadingTask.promise;
          
          console.log('📊 Total de páginas:', pdf.numPages);
          
          let fullText = '';
          
                      // Extrair texto de todas as páginas
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
              const page = await pdf.getPage(pageNum);
              const textContent = await page.getTextContent();
              
              // Reconstruir o texto mantendo quebras de linha e espaçamento
              let pageText = '';
              let lastY = null;
              
              textContent.items.forEach(item => {
                // Se mudou de linha (Y diferente), adicionar quebra
                if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
                  pageText += '\n';
                }
                pageText += item.str + ' ';
                lastY = item.transform[5];
              });
              
              fullText += pageText + '\n\n';
            }
          
          console.log('📄 Texto bruto extraído do PDF (primeiras 500 chars):');
          console.log(fullText.substring(0, 500));
          
          // Extrair dados estruturados
          const extractedData = extractMovimentacaoFromPDF(fullText);
          
          console.log('✅ Dados extraídos:', extractedData);
          
          resolve(extractedData);
        } catch (error) {
          console.error('❌ Erro ao processar PDF:', error);
          reject(error);
        }
      };
      reader.readAsArrayBuffer(file);
    });
  };

  // Definição das colunas XLSX conforme documentação Matriciale
  const xlsxColumnMapping = [
    {
      "coluna": "A",
      "nome_coluna": "Código sistêmico do item",
      "nome_normalizado": "cod_sistemico_item",
      "tipo": "texto",
      "formato": "9 números e 2 pontos divisor de milhar (ex: 325.023.001)"
    },
    {
      "coluna": "B",
      "nome_coluna": "Descrição (nome) do item",
      "nome_normalizado": "descricao_item",
      "tipo": "texto"
    },
    {
      "coluna": "C",
      "nome_coluna": "Coluna em branco",
      "nome_normalizado": "coluna_branco",
      "tipo": "vazio"
    },
    {
      "coluna": "D",
      "nome_coluna": "Unidade do item",
      "nome_normalizado": "unidade_item",
      "tipo": "texto",
      "observacao": "cp = comprimidos; ev = envelopes; tb = tubos; amp = ampolas. Esse campo não é utilizado atualmente."
    },
    {
      "coluna": "E",
      "nome_coluna": "Quantidade período inicial",
      "nome_normalizado": "qtd_periodo_inicial",
      "tipo": "número"
    },
    {
      "coluna": "F",
      "nome_coluna": "Valor do item período inicial",
      "nome_normalizado": "valor_item_periodo_inicial",
      "tipo": "número"
    },
    {
      "coluna": "G",
      "nome_coluna": "Quantidade de entradas no período",
      "nome_normalizado": "qtd_entradas_periodo",
      "tipo": "número"
    },
    {
      "coluna": "H",
      "nome_coluna": "Valor de entradas no período",
      "nome_normalizado": "valor_entradas_periodo",
      "tipo": "número"
    },
    {
      "coluna": "I",
      "nome_coluna": "Quantidade de saídas no período",
      "nome_normalizado": "qtd_saidas_periodo",
      "tipo": "número"
    },
    {
      "coluna": "J",
      "nome_coluna": "Valor de saídas no período",
      "nome_normalizado": "valor_saidas_periodo",
      "tipo": "número"
    },
    {
      "coluna": "K",
      "nome_coluna": "Quantidade período final (estoque atual)",
      "nome_normalizado": "qtd_periodo_final",
      "tipo": "número"
    },
    {
      "coluna": "L",
      "nome_coluna": "Valor unitário do item período final",
      "nome_normalizado": "val_unit_periodo_final",
      "tipo": "número",
      "observacao": "valor total dividido pela quantidade final – muitos itens tem fornecedores diferentes com valores unitários diferente, mas a Fiorilli faz uma média"
    },
    {
      "coluna": "M",
      "nome_coluna": "Valor do item período final",
      "nome_normalizado": "valor_item_periodo_final",
      "tipo": "número"
    }
  ];

  const handleXLSXFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const workbook = XLSX.read(e.target.result, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Extrair dados como array de arrays para controle total
          const rawData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1, 
            defval: '',
            raw: false 
          });

          console.log('📊 Dados brutos XLSX:', rawData.slice(0, 5));

          // Encontrar linha de início dos dados (primeira linha com dados válidos)
          let startRow = 0;
          for (let i = 0; i < rawData.length; i++) {
            const row = rawData[i];
            // Verificar se a linha tem dados na coluna A (código) e B (descrição)
            if (row[0] && row[1] && row[0].toString().trim() !== '' && row[1].toString().trim() !== '') {
              startRow = i;
              break;
            }
          }

          console.log(`📋 Linha de início dos dados: ${startRow}`);

          // Processar cada linha de dados
          const processedData = [];
          for (let i = startRow; i < rawData.length; i++) {
            const row = rawData[i];
            
            // Verificar se a linha tem conteúdo mínimo (código e descrição)
            if (!row[0] || !row[1] || row[0].toString().trim() === '' || row[1].toString().trim() === '') {
              continue;
            }

            // Mapear cada coluna conforme a especificação
            const mappedRow = {};
            
            xlsxColumnMapping.forEach((colDef, index) => {
              const cellValue = row[index] || '';
              const normalizedName = colDef.nome_normalizado;
              
              // Processar valor conforme o tipo
              let processedValue = cellValue;
              
              if (colDef.tipo === 'número' && cellValue !== '') {
                // Converter para número, tratando formatos brasileiros
                const numStr = cellValue.toString().replace(/[^\d.,-]/g, '');
                if (numStr !== '') {
                  // Formato brasileiro: 1.000,50 -> 1000.50
                  if (numStr.includes('.') && numStr.includes(',')) {
                    processedValue = parseFloat(numStr.replace(/\./g, '').replace(',', '.'));
                  } else if (numStr.includes(',')) {
                    // Apenas vírgula: pode ser decimal
                    processedValue = parseFloat(numStr.replace(',', '.'));
                  } else {
                    processedValue = parseFloat(numStr);
                  }
                  
                  // Se não conseguiu converter, manter como string
                  if (isNaN(processedValue)) {
                    processedValue = cellValue.toString();
                  }
                } else {
                  processedValue = null;
                }
              } else if (colDef.tipo === 'texto') {
                processedValue = cellValue.toString().trim();
              } else if (colDef.tipo === 'vazio') {
                processedValue = null;
              }
              
              mappedRow[normalizedName] = processedValue;
            });

            // Adicionar metadados úteis
            mappedRow._linha_original = i + 1;
            mappedRow._dados_brutos = row;

            processedData.push(mappedRow);
          }

          console.log(`✅ Processadas ${processedData.length} linhas de dados XLSX`);
          console.log('📋 Exemplo de linha processada:', processedData[0]);

          resolve(processedData);
        } catch (error) {
          console.error('❌ Erro ao processar XLSX:', error);
          reject(error);
        }
      };
      reader.readAsBinaryString(file);
    });
  };

  const handleCSVFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const csvData = e.target.result;
          const results = Papa.parse(csvData, {
            header: true,
            dynamicTyping: false,
            transformHeader: (header) => header.trim(),
            transform: (value, header) => {
              if (header === 'F') {
                const parsedDate = moment(value, ['DD/MM/YYYY']);
                if (parsedDate.isValid()) {
                  return parsedDate.format('DD/MM/YYYY');
                }
                return value;
              }

              if (header === 'COD_ITEM') {
                const numValue = Number(value);
                return !isNaN(numValue) 
                  ? String(Math.floor(numValue)) 
                  : (value || '');
              }

              return value;
            }
          });

          resolve(results.data);
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsText(file);
    });
  };

  const handleFile = async (file) => {
    const fileExtension = file.name.split('.').pop().toLowerCase();

    let processingPromise;
    if (fileExtension === 'xlsx') {
      processingPromise = handleXLSXFile(file);
    } else if (fileExtension === 'csv') {
      processingPromise = handleCSVFile(file);
    } else if (fileExtension === 'pdf') {
      processingPromise = handlePDFFile(file);
    } else {
      setJsonOutput('Formato de arquivo não suportado. Formatos aceitos: .xlsx, .csv, .pdf');
      return;
    }

    try {
      const convertedData = await processingPromise;
      
      if (!convertedData) {
        throw new Error('Nenhum dado encontrado no arquivo');
      }

      // Para PDF, mostrar dados estruturados completos
      if (fileExtension === 'pdf') {
        setJsonOutput(JSON.stringify(convertedData, null, 2));
      } else {
        // Para XLSX e CSV, mostrar preview como antes
        if (!convertedData.length || convertedData.length === 0) {
          throw new Error('Nenhum dado encontrado no arquivo');
        }
        
        const displayData = convertedData.slice(0, 100);
        setJsonOutput(JSON.stringify({
          totalRecords: convertedData.length,
          previewRecords: displayData
        }, null, 2));
      }

      console.log('Dados convertidos:', convertedData);
    } catch (error) {
      console.error('Erro completo:', error);
      setJsonOutput(`Erro: ${error.message}`);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragActive(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleTestPDF = () => {
    console.log('🧪 Executando teste PDF com dados simulados...');
    
    // Dados de teste simulados
    const mockPDFText = `
PREFEITURA MUNICIPAL DE PALMARES PAULISTA
Relatório de Movimentação de Estoque de 26/05/2025 até 01/06/2025

Página 1

AAS - ÁCIDO ACETIL SALICÍLICO 100MG
325.023.001                                           CP

Data        Histórico                    Documento    Requisição    Movimento        Estoque    Observação
                                                                   Entrada  Saída

25/05/2025  SALDO ANTERIOR                                                   0      12.290
27/05/2025  FARMACIA OLAVO DOMINGUES     0000874/2025                      500      11.790    Transferência nº 2063
29/05/2025  UBS III OLAVO DOMINGUES      0000891/2025                       20      11.770    Transferência nº 2073

Página 2

DIPIRONA SÓDICA 500MG/ML
412.015.002                                          AMP

Data        Histórico                    Documento    Requisição    Movimento        Estoque    Observação
                                                                   Entrada  Saída

26/05/2025  SALDO ANTERIOR                                                   0       5.000
28/05/2025  POSTO DE SAÚDE CENTRAL       0000910/2025                      150       4.850    Transferência nº 2075
`;
    
    const testResult = extractMovimentacaoFromPDF(mockPDFText);
    setJsonOutput(JSON.stringify(testResult, null, 2));
  };

  const handleTestXLSX = () => {
    console.log('🧪 Executando teste XLSX com dados simulados...');
    
    // Simular dados XLSX como array de arrays
    const mockXLSXData = [
      ['325.023.001', 'AAS - ÁCIDO ACETIL SALICÍLICO 100MG', '', 'CP', '1200', '12000.00', '500', '5000.00', '200', '2000.00', '1500', '8.00', '12000.00'],
      ['412.015.002', 'DIPIRONA SÓDICA 500MG/ML', '', 'AMP', '100', '1500.00', '50', '750.00', '20', '300.00', '130', '15.00', '1950.00'],
      ['501.007.001', 'PARACETAMOL 750MG', '', 'CP', '850', '2550.00', '300', '900.00', '150', '450.00', '1000', '3.00', '3000.00']
    ];

    // Processar usando a mesma lógica do handleXLSXFile
    const processedData = [];
    
    mockXLSXData.forEach((row, index) => {
      const mappedRow = {};
      
      xlsxColumnMapping.forEach((colDef, colIndex) => {
        const cellValue = row[colIndex] || '';
        const normalizedName = colDef.nome_normalizado;
        
        let processedValue = cellValue;
        
        if (colDef.tipo === 'número' && cellValue !== '') {
          const numStr = cellValue.toString().replace(/[^\d.,-]/g, '');
          if (numStr !== '') {
            if (numStr.includes('.') && numStr.includes(',')) {
              processedValue = parseFloat(numStr.replace(/\./g, '').replace(',', '.'));
            } else if (numStr.includes(',')) {
              processedValue = parseFloat(numStr.replace(',', '.'));
            } else {
              processedValue = parseFloat(numStr);
            }
            
            if (isNaN(processedValue)) {
              processedValue = cellValue.toString();
            }
          } else {
            processedValue = null;
          }
        } else if (colDef.tipo === 'texto') {
          processedValue = cellValue.toString().trim();
        } else if (colDef.tipo === 'vazio') {
          processedValue = null;
        }
        
        mappedRow[normalizedName] = processedValue;
      });

      mappedRow._linha_original = index + 1;
      mappedRow._dados_brutos = row;
      
      processedData.push(mappedRow);
    });

    setJsonOutput(JSON.stringify({
      totalRecords: processedData.length,
      columnMapping: xlsxColumnMapping,
      data: processedData
    }, null, 2));
  };

  return (
    <div className="file-converter-container">
      <h1>Conversor de Arquivos - Matriciale</h1>
      <div 
        className={`drop-zone ${isDragActive ? 'active' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <p>Arraste e solte seu arquivo aqui (.csv, .xlsx, .pdf)</p>
        <button 
          className="browse-btn"
          onClick={handleBrowseClick}
        >
          Escolher Arquivo
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.pdf"
          style={{ display: 'none' }}
          onChange={handleFileInputChange}
        />
      </div>
      <div className="output-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h2>Resultado (JSON):</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={handleTestXLSX}
              style={{
                padding: '8px 16px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              📊 Testar XLSX
            </button>
            <button 
              onClick={handleTestPDF}
              style={{
                padding: '8px 16px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              📄 Testar PDF
            </button>
          </div>
        </div>
        <pre className="json-output">{jsonOutput}</pre>
      </div>
    </div>
  );
};

export default FileConverter; 