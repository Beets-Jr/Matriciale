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
    sheetData.push([
      '', // Classificação em branco
      item['B'] || '', // NOME ITEM 
      item['A'] || ''  // COD_ITEM
    ]);
  });

  // Criar folha de Semana
  const semanaSheetData = [
    ['DATA', 'SEMANA'] // Cabeçalho
  ];

  // Gerar datas e índices de semana para o ano atual
  const currentYear = new Date().getFullYear();
  let currentDate = new Date(currentYear, 0, 1);
  let weekCounter = 1;

  // Encontrar a primeira segunda-feira do ano
  while (currentDate.getDay() !== 1) {
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Gerar linhas para todas as semanas do ano
  while (currentDate.getFullYear() === currentYear) {
    const formattedDate = `${String(currentDate.getDate()).padStart(2, '0')}/${String(currentDate.getMonth() + 1).padStart(2, '0')}/${currentDate.getFullYear()}`;
    const weekIndex = `${currentYear}_${String(weekCounter).padStart(2, '0')}`;
    
    semanaSheetData.push([formattedDate, weekIndex]);

    // Avançar para próxima semana
    currentDate.setDate(currentDate.getDate() + 7);
    weekCounter++;
  }

  // Cria workbook
  const wb = XLSX.utils.book_new();

  // Adiciona planilhas
  const ws1 = XLSX.utils.aoa_to_sheet(sheetData);
  const ws2 = XLSX.utils.aoa_to_sheet(semanaSheetData);
  
  XLSX.utils.book_append_sheet(wb, ws1, 'Planilha Personalizada');
  XLSX.utils.book_append_sheet(wb, ws2, 'Semana');
  
  // Salva arquivo XLSX
  XLSX.writeFile(wb, 'planilha_personalizada.xlsx');

  // Retorna os dados para manter a compatibilidade com o código existente
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

  // Criar folha de Semana
  const semanaSheetData = [
    ['DATA', 'SEMANA'] // Cabeçalho
  ];

  // Gerar datas e índices de semana para o ano atual
  const currentYear = new Date().getFullYear();
  let currentDate = new Date(currentYear, 0, 1);
  let weekCounter = 1;

  // Encontrar a primeira segunda-feira do ano
  while (currentDate.getDay() !== 1) {
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Gerar linhas para todas as semanas do ano
  while (currentDate.getFullYear() === currentYear) {
    const formattedDate = `${String(currentDate.getDate()).padStart(2, '0')}/${String(currentDate.getMonth() + 1).padStart(2, '0')}/${currentDate.getFullYear()}`;
    const weekIndex = `${currentYear}_${String(weekCounter).padStart(2, '0')}`;
    
    semanaSheetData.push([formattedDate, weekIndex]);

    // Avançar para próxima semana
    currentDate.setDate(currentDate.getDate() + 7);
    weekCounter++;
  }

  // Cria sheets
  const ws1 = XLSX.utils.aoa_to_sheet(planilhaPersonalizada);
  const ws2 = XLSX.utils.aoa_to_sheet(semanaSheetData);
  
  // Adiciona planilhas ao workbook
  XLSX.utils.book_append_sheet(wb, ws1, 'Planilha Personalizada');
  XLSX.utils.book_append_sheet(wb, ws2, 'Semana');
  
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
    sheetData.push([
      '', // Classificação em branco
      item['B'] || '', // NOME ITEM 
      item['A'] || ''  // COD_ITEM
    ]);
  });

  // Criar folha de Semana
  const semanaSheetData = [
    ['DATA', 'SEMANA'] // Cabeçalho
  ];

  // Gerar datas e índices de semana para o ano atual
  const currentYear = new Date().getFullYear();
  let currentDate = new Date(currentYear, 0, 1);
  let weekCounter = 1;

  // Encontrar a primeira segunda-feira do ano
  while (currentDate.getDay() !== 1) {
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Gerar linhas para todas as semanas do ano
  while (currentDate.getFullYear() === currentYear) {
    const formattedDate = `${String(currentDate.getDate()).padStart(2, '0')}/${String(currentDate.getMonth() + 1).padStart(2, '0')}/${currentDate.getFullYear()}`;
    const weekIndex = `${currentYear}_${String(weekCounter).padStart(2, '0')}`;
    
    semanaSheetData.push([formattedDate, weekIndex]);

    // Avançar para próxima semana
    currentDate.setDate(currentDate.getDate() + 7);
    weekCounter++;
  }

  // Adicione esta parte no evento de clique do botão
  gerarPlanilhaBtn.addEventListener('click', () => {
    // Cria workbook
    const wb = XLSX.utils.book_new();

    // Adiciona planilhas
    const ws1 = XLSX.utils.aoa_to_sheet(sheetData);
    const ws2 = XLSX.utils.aoa_to_sheet(semanaSheetData);
    
    XLSX.utils.book_append_sheet(wb, ws1, 'Planilha Personalizada');
    XLSX.utils.book_append_sheet(wb, ws2, 'Semana');
    
    // Salva arquivo XLSX
    XLSX.writeFile(wb, 'planilha_personalizada.xlsx');
  });

  // Retorna os dados para manter a compatibilidade com o código existente
  return sheetData;
}

//Fim do código pertinente ao primeiro drag and drop + conversão para Objetos JSON

// Segundo drag and dorp

// Selecione os novos elementos
const dropZonePDF = document.getElementById('dropZonePDF');
const fileInputPDF = document.getElementById('fileInputPDF');
const browseBtnPDF = document.getElementById('browseBtnPDF');

// Funções de manipulação de eventos para PDF (similar ao XLSX)
dropZonePDF.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZonePDF.classList.add('active');
});

dropZonePDF.addEventListener('dragleave', () => {
  dropZonePDF.classList.remove('active');
});

// Função para lidar com arquivos PDF
function handlePDFFile(file) {
  return new Promise((resolve, reject) => {
    // Verifica se o arquivo é um PDF
    if (file.type !== 'application/pdf') {
      reject(new Error('Por favor, selecione um arquivo PDF válido'));
      return;
    }

    // Usa a biblioteca pdf.js para processar o PDF
    const fileReader = new FileReader();
    
    fileReader.onload = async (e) => {
      try {
        // Carrega o PDF
        const typedArray = new Uint8Array(e.target.result);
        const pdf = await pdfjsLib.getDocument(typedArray).promise;
        
        // Array para armazenar o texto extraído
        const extractedText = [];
        
        // Extrai texto de cada página
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          
          // Concatena o texto da página
          const pageText = textContent.items.map(item => item.str).join(' ');
          extractedText.push({
            page: pageNum,
            text: pageText
          });
        }
        
        resolve(extractedText);
      } catch (error) {
        reject(new Error(`Erro ao processar PDF: ${error.message}`));
      }
    };
    
    fileReader.onerror = (error) => {
      reject(new Error(`Erro de leitura do arquivo PDF: ${error}`));
    };
    
    // Lê o arquivo como ArrayBuffer
    fileReader.readAsArrayBuffer(file);
  });
}

// Evento de drop para PDF
dropZonePDF.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZonePDF.classList.remove('active');
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    const file = files[0];
    
    // Verifica se é um PDF
    if (file.type === 'application/pdf') {
      handlePDFFile(file)
        .then(extractedText => {
          // Exibe o texto extraído
          jsonOutput.textContent = JSON.stringify({
            totalPages: extractedText.length,
            extractedText: extractedText
          }, null, 2);
        })
        .catch(error => {
          jsonOutput.textContent = `Erro: ${error.message}`;
        });
    } else {
      jsonOutput.textContent = 'Por favor, solte apenas arquivos PDF';
    }
  }
});

// Evento de seleção de arquivo para PDF
browseBtnPDF.addEventListener('click', () => {
  fileInputPDF.click();
});

fileInputPDF.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file && file.type === 'application/pdf') {
    handlePDFFile(file)
      .then(extractedText => {
        // Exibe o texto extraído
        jsonOutput.textContent = JSON.stringify({
          totalPages: extractedText.length,
          extractedText: extractedText
        }, null, 2);
      })
      .catch(error => {
        jsonOutput.textContent = `Erro: ${error.message}`;
      });
  } else {
    jsonOutput.textContent = 'Por favor, selecione um arquivo PDF válido';
  }
});

// Calendário 

class CompactCalendar {
    constructor() {
        this.currentDate = new Date();
        this.monthNames = [
            'Janeiro', 'Fevereiro', 'Março', 'Abril', 
            'Maio', 'Junho', 'Julho', 'Agosto', 
            'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];
        this.dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

        // Paleta de cores para intervalos
        this.intervalColors = [
            { background: '#e6f2ff', text: '#2980b9' },    // Azul claro
            { background: '#fff3cd', text: '#856404' },    // Amarelo claro
            { background: '#d4edda', text: '#155724' },    // Verde claro
            { background: '#f8d7da', text: '#721c24' }     // Rosa claro
        ];

        // Gerar intervalos para o ano inteiro
        this.highlightIntervals = this.generateYearlyIntervals(this.currentDate.getFullYear());

        this.initElements();
        this.addEventListeners();
        this.renderCalendar();
    }

    generateYearlyIntervals(year) {
    const intervals = [];
    let weekCounter = 1;
    
    // Começar do primeiro dia do ano
    const startOfYear = new Date(year, 0, 1);
    
    // Encontrar a primeira segunda-feira do ano
    let firstMonday = new Date(startOfYear);
    firstMonday.setDate(startOfYear.getDate() + (startOfYear.getDay() <= 1 ? 1 - startOfYear.getDay() : 8 - startOfYear.getDay()));

    // Gerar intervalos para todo o ano
    while (firstMonday.getFullYear() === year) {
        const start = new Date(firstMonday);
        const end = new Date(firstMonday);
        end.setDate(end.getDate() + 6);

        intervals.push({
            start: this.formatDate(start),
            end: this.formatDate(end),
            colorIndex: (weekCounter - 1) % this.intervalColors.length,
            weekIndex: weekCounter
        });

        // Mover para próxima semana
        firstMonday.setDate(firstMonday.getDate() + 7);
        weekCounter++;
    }

    return intervals;
}

    initElements() {
        this.headerElement = document.getElementById('currentMonthYear');
        this.gridElement = document.getElementById('calendarGrid');
        this.prevButton = document.getElementById('prevMonth');
        this.nextButton = document.getElementById('nextMonth');
    }

    addEventListeners() {
        this.prevButton.addEventListener('click', () => this.changeMonth(-1));
        this.nextButton.addEventListener('click', () => this.changeMonth(1));
    }

    changeMonth(delta) {
        this.currentDate.setMonth(this.currentDate.getMonth() + delta);
        
        // Verificar se mudou de ano
        if (this.currentDate.getMonth() === 0 || this.currentDate.getMonth() === 11) {
            this.highlightIntervals = this.generateYearlyIntervals(this.currentDate.getFullYear());
        }
        
        this.renderCalendar();
    }

    isDateInInterval(date, intervals) {
        const dateString = this.formatDate(date);
        return intervals.find(interval => 
            dateString >= interval.start && dateString <= interval.end
        );
    }

    formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    renderCalendar() {
        // Limpar grade anterior
        this.gridElement.innerHTML = '';

        // Renderizar cabeçalho dos dias
        this.dayNames.forEach(dayName => {
            const dayNameElement = document.createElement('div');
            dayNameElement.classList.add('day', 'day-name');
            dayNameElement.textContent = dayName;
            this.gridElement.appendChild(dayNameElement);
        });

        // Atualizar título do mês
        this.headerElement.textContent = `${this.monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;

        // Configurar data para o primeiro dia do mês
        const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
        const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);

        // Determinar dia inicial da semana
        const startingDay = firstDay.getDay();

        // Adicionar dias vazios antes do primeiro dia
        for (let i = 0; i < startingDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.classList.add('day', 'other-month');
            this.gridElement.appendChild(emptyDay);
        }

        // Renderizar dias do mês
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const dayElement = document.createElement('div');
            dayElement.classList.add('day');
            dayElement.textContent = day;

            // Criar data para o dia atual
            const currentDayDate = new Date(
                this.currentDate.getFullYear(), 
                this.currentDate.getMonth(), 
                day
            );

            // Verificar se é o dia atual
            const today = new Date();
            if (
                day === today.getDate() && 
                this.currentDate.getMonth() === today.getMonth() && 
                this.currentDate.getFullYear() === today.getFullYear()
            ) {
                dayElement.classList.add('today');
            }

            // Verificar se o dia está em um intervalo de destaque
            const highlightInterval = this.isDateInInterval(currentDayDate, this.highlightIntervals);
            if (highlightInterval) {
                dayElement.classList.add('highlight-interval');
                const color = this.intervalColors[highlightInterval.colorIndex];
                dayElement.style.backgroundColor = color.background;
                dayElement.style.color = color.text;

                // Adicionar índice da semana
                const weekIndex = `${this.currentDate.getFullYear()}_${highlightInterval.weekIndex.toString().padStart(2, '0')}`;
                dayElement.setAttribute('data-week-index', weekIndex);
                dayElement.classList.add('has-week-index');
            }

            this.gridElement.appendChild(dayElement);
        }
    }
}

// Inicializar calendário quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    new CompactCalendar();
});