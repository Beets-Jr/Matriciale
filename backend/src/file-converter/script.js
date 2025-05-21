const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const browseBtn = document.getElementById('browseBtn');
const jsonOutput = document.getElementById('jsonOutput');

// Eventos de drag and drop
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('active');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('active');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('active');
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    handleFile(files[0]);
  }
});

// Clique para abrir seletor de arquivos
browseBtn.addEventListener('click', () => {
  fileInput.click();
});

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    handleFile(file);
  }
});

function parseExcelDate(excelDate) {
  // Converte número de série do Excel para data
  const date = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`; // Formato DD/MM/YYYY
}

function handleXLSXFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = function(e) {
      try {
        // Ler o arquivo xlsx
        const workbook = XLSX.read(e.target.result, { type: 'binary' });
        
        // Selecionar a primeira planilha
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Converter para array de objetos
        const data = XLSX.utils.sheet_to_json(worksheet, { 
          header: 'A', // Usar letras das colunas como chaves
          defval: null, // Valor padrão para células vazias
          raw: false // Converte datas e números
        });
        
        // Mapear os objetos para processar datas do Excel se necessário
        const processedData = data.map(row => {
          const processedRow = {};
          
          Object.keys(row).forEach(key => {
            // Verificar e converter datas do Excel
            if (key !== '!ref') {
              let value = row[key];
              
              // Verificar se é uma data do Excel
              if (typeof value === 'number' && value > 0 && value < 50000) {
                try {
                  value = parseExcelDate(value);
                } catch (dateError) {
                  console.warn('Erro ao converter data:', dateError);
                }
              }
              
              processedRow[key] = value;
            }
          });
          
          return processedRow;
        });
        
        resolve(processedData);
      } catch (error) {
        reject(new Error(`Erro ao processar arquivo XLSX: ${error.message}`));
      }
    };
    
    reader.onerror = function(error) {
      reject(new Error(`Erro de leitura do arquivo: ${error}`));
    };
    
    // Ler o arquivo como binário
    reader.readAsBinaryString(file);
  });
}

function handleCSVFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = function(e) {
      try {
        // Converter o CSV para array de objetos
        const csvData = e.target.result;
        const lines = csvData.split('\n');
        
        // Extrair cabeçalho
        const headers = lines[0].split(',').map(header => header.trim());
        
        // Processar linhas de dados
        const data = lines.slice(1)
          .filter(line => line.trim() !== '') // Remover linhas vazias
          .map(line => {
            const values = line.split(',').map(value => value.trim());
            
            // Criar objeto mapeando cabeçalhos para valores
            const rowObj = {};
            headers.forEach((header, index) => {
              let value = values[index] || null;
              
              // Tentar converter valores
              if (value !== null) {
                // Remover aspas se existirem
                value = value.replace(/^["']|["']$/g, '');
                
                // Converter para número se possível
                const numValue = parseFloat(value);
                if (!isNaN(numValue)) {
                  value = numValue;
                }
              }
              
              rowObj[header] = value;
            });
            
            return rowObj;
          });
        
        resolve(data);
      } catch (error) {
        reject(new Error(`Erro ao processar arquivo CSV: ${error.message}`));
      }
    };
    
    reader.onerror = function(error) {
      reject(new Error(`Erro de leitura do arquivo: ${error}`));
    };
    
    // Ler o arquivo como texto
    reader.readAsText(file, 'UTF-8');
  });
}

function gerarPlanilhaPersonalizada(convertedData) {
  // Nova planilha terá 3 colunas: CLASSIFICAÇÃO, NOME ITEM, COD_ITEM
  const sheetData = [
    ['CLASSIFICAÇÃO', 'NOME ITEM', 'COD_ITEM'] // Cabeçalho
  ];

  // Mapear os dados da planilha original para o novo formato
  convertedData.forEach(item => {
    // Adiciona uma linha com:
    // A: CLASSIFICAÇÃO (vazio por padrão)
    // B: NOME ITEM (valor da coluna B do arquivo original)
    // C: COD_ITEM (valor da coluna A do arquivo original)
    sheetData.push([
      '', // Classificação em branco
      item['B'] || '', // NOME ITEM 
      item['A'] || ''  // COD_ITEM
    ]);
  });

  return sheetData;
}

function handleFile(file) {
  const fileExtension = file.name.split('.').pop().toLowerCase();

  // Modificação aqui: aceita APENAS arquivos .xlsx
  if (fileExtension !== 'xlsx') {
    // Cria um elemento de aviso personalizado
    const avisoDiv = document.createElement('div');
    avisoDiv.style.backgroundColor = '#ffcccc';
    avisoDiv.style.color = '#ff0000';
    avisoDiv.style.padding = '10px';
    avisoDiv.style.marginTop = '10px';
    avisoDiv.style.borderRadius = '5px';
    avisoDiv.textContent = 'Atenção: Somente arquivos .xlsx são permitidos!';

    // Remove avisos anteriores
    const avisoAntigo = document.getElementById('avisoArquivoInvalido');
    if (avisoAntigo) {
      avisoAntigo.remove();
    }

    // Adiciona ID para futuras remoções
    avisoDiv.id = 'avisoArquivoInvalido';

    // Insere o aviso após o jsonOutput
    jsonOutput.parentNode.insertBefore(avisoDiv, jsonOutput.nextSibling);

    // Limpa o campo de saída
    jsonOutput.textContent = '';

    return;
  }

  // Processamento do arquivo XLSX
  const processingPromise = handleXLSXFile(file);

  processingPromise
    .then(convertedData => {
      if (!convertedData || convertedData.length === 0) {
        throw new Error('Nenhum dado encontrado no arquivo');
      }

      const displayData = convertedData.slice(0, 100);
      
      // Exibe dados originais
      jsonOutput.textContent = JSON.stringify({
        totalRecords: convertedData.length,
        previewRecords: displayData
      }, null, 2);

      // Adiciona botão para gerar planilha
      const gerarPlanilhaBtn = document.createElement('button');
      gerarPlanilhaBtn.textContent = 'Gerar Planilha Personalizada';
      gerarPlanilhaBtn.style.padding = '10px';
      gerarPlanilhaBtn.style.backgroundColor = '#4CAF50';
      gerarPlanilhaBtn.style.color = 'white';
      gerarPlanilhaBtn.style.border = 'none';
      gerarPlanilhaBtn.style.borderRadius = '5px';
      gerarPlanilhaBtn.style.cursor = 'pointer';
      gerarPlanilhaBtn.style.marginTop = '10px';

      // Remove elementos anteriores, se existirem
      const oldBtn = document.getElementById('gerarPlanilhaPersonalizadaBtn');
      if (oldBtn) {
        oldBtn.remove();
      }

      // Define ID para o botão
      gerarPlanilhaBtn.id = 'gerarPlanilhaPersonalizadaBtn';

      // Evento de clique para gerar planilha
      gerarPlanilhaBtn.addEventListener('click', () => {
        // Gera planilha personalizada
        const planilhaPersonalizada = gerarPlanilhaPersonalizada(convertedData);

        // Cria workbook
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(planilhaPersonalizada);
        
        // Adiciona planilha ao workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Planilha Personalizada');
        
        // Salva arquivo XLSX
        XLSX.writeFile(wb, 'planilha_personalizada.xlsx');
      });

      // Adiciona botão após o jsonOutput
      jsonOutput.parentNode.insertBefore(gerarPlanilhaBtn, jsonOutput.nextSibling);

      console.log('Dados convertidos:', convertedData);
    })
    .catch(error => {
      console.error('Erro completo:', error);
      jsonOutput.textContent = `Erro: ${error.message}`;
    });
}

// Modificações nos event listeners para drop e input de arquivo
dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('active');
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    // Verifica extensão antes de processar
    const fileExtension = files[0].name.split('.').pop().toLowerCase();
    if (fileExtension === 'xlsx') {
      handleFile(files[0]);
    } else {
      // Mostra mensagem de erro para arquivos não .xlsx
      jsonOutput.textContent = 'Apenas arquivos .xlsx são permitidos';
    }
  }
});

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    // Verifica extensão antes de processar
    const fileExtension = file.name.split('.').pop().toLowerCase();
    if (fileExtension === 'xlsx') {
      handleFile(file);
    } else {
      // Mostra mensagem de erro para arquivos não .xlsx
      jsonOutput.textContent = 'Apenas arquivos .xlsx são permitidos';
    }
  }
});

function gerarPlanilhaPersonalizada(convertedData) {
  // Nova planilha terá 3 colunas: CLASSIFICAÇÃO, NOME ITEM, COD_ITEM
  const sheetData = [
    ['CLASSIFICAÇÃO', 'NOME ITEM', 'COD_ITEM'] // Cabeçalho
  ];

  // Mapear os dados da planilha original para o novo formato
  convertedData.forEach(item => {
    // Adiciona uma linha com:
    // A: CLASSIFICAÇÃO (vazio por padrão)
    // B: NOME ITEM (valor da coluna B do arquivo original)
    // C: COD_ITEM (valor da coluna A do arquivo original)
    sheetData.push([
      '', // Classificação em branco
      item['B'] || '', // NOME ITEM 
      item['A'] || ''  // COD_ITEM
    ]);
  });

  return sheetData;
}

//Fim do código pertinente ao sistema drag and drop + conversão para Objetos JSON