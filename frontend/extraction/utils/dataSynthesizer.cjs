const moment = require('moment');

class DataSynthesizer {
  constructor(logger) {
    this.logger = logger;
  }

  generateHistoricalData(movimentacaoData) {
    if (!movimentacaoData.movimentacoes || movimentacaoData.movimentacoes.length === 0) {
      this.logger.warn('Nenhuma movimentação real encontrada para gerar dados sintéticos');
      return { movimentacoes_sinteticas: [], total_movimentacoes_sinteticas: 0 };
    }

    // Encontrar data mais antiga dos dados reais
    const datasReais = movimentacaoData.movimentacoes
      .map(m => moment(m.data_movimentacao))
      .filter(d => d.isValid())
      .sort((a, b) => a.diff(b));

    if (datasReais.length === 0) {
      this.logger.warn('Nenhuma data válida encontrada nos dados reais');
      return { movimentacoes_sinteticas: [], total_movimentacoes_sinteticas: 0 };
    }

    const dataInicioReal = datasReais[0];
    const dataInicioSintetico = dataInicioReal.clone().subtract(52, 'weeks');

    this.logger.info(`Gerando dados sintéticos de ${dataInicioSintetico.format('YYYY-MM-DD')} até ${dataInicioReal.format('YYYY-MM-DD')}`);

    // Extrair itens únicos dos dados reais
    const itensUnicos = this.extractUniqueItems(movimentacaoData.movimentacoes);
    
    this.logger.info(`Gerando dados sintéticos para ${itensUnicos.length} itens únicos`);

    // Gerar dados sintéticos
    const movimentacoesSinteticas = [];
    
    for (let semana = 0; semana < 52; semana++) {
      const dataBase = dataInicioSintetico.clone().add(semana, 'weeks');
      
      itensUnicos.forEach(item => {
        // 70% de chance de ter movimentação na semana
        if (Math.random() < 0.70) {
          const movimentacoesSemana = this.generateWeekMovements(dataBase, item, semana);
          movimentacoesSinteticas.push(...movimentacoesSemana);
        }
      });
    }

    this.logger.info(`Geradas ${movimentacoesSinteticas.length} movimentações sintéticas`);

    return {
      timestamp: new Date().toISOString(),
      periodo_sintetico: '52 semanas anteriores',
      data_inicio_sintetico: dataInicioSintetico.format('YYYY-MM-DD'),
      data_fim_sintetico: dataInicioReal.format('YYYY-MM-DD'),
      total_movimentacoes_sinteticas: movimentacoesSinteticas.length,
      parametros_geracao: {
        frequencia_ocorrencia: 0.70,
        volume_min: 1,
        volume_max: 200,
        picos_sazonais: 0.20,
        vales_sazonais: 0.10
      },
      movimentacoes_sinteticas: movimentacoesSinteticas
    };
  }

  extractUniqueItems(movimentacoes) {
    const itemsMap = new Map();

    movimentacoes.forEach(mov => {
      const key = `${mov.codigo_item}_${mov.unidade}`;
      if (!itemsMap.has(key)) {
        itemsMap.set(key, {
          codigo_item: mov.codigo_item,
          nome_item: mov.nome_item,
          unidade: mov.unidade,
          id_unidade: mov.id_unidade,
          classificacao: mov.classificacao
        });
      }
    });

    return Array.from(itemsMap.values());
  }

  generateWeekMovements(dataBase, item, semanaIndex) {
    const movimentos = [];
    
    // Determinar padrão sazonal
    const isSemanaAlta = Math.random() < 0.20; // 20% picos
    const isSemanasBaixa = Math.random() < 0.10; // 10% vales
    
    // Gerar 1-3 movimentações por semana
    const numMovimentacoes = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < numMovimentacoes; i++) {
      // Data aleatória dentro da semana
      const diasOffset = Math.floor(Math.random() * 7);
      const dataMovimentacao = dataBase.clone().add(diasOffset, 'days');
      
      // Gerar volume baseado na sazonalidade
      let volume = this.generateVolume(isSemanaAlta, isSemanasBaixa);
      
      // Escolher tipo de movimento (apenas SA e SU conforme especificação)
      const tipoMovimento = Math.random() < 0.7 ? 'SA' : 'SU';
      
      const movimento = {
        id_unidade: item.id_unidade,
        unidade: item.unidade,
        codigo_item: item.codigo_item,
        nome_item: item.nome_item,
        classificacao: item.classificacao,
        data_movimentacao: dataMovimentacao.format('YYYY-MM-DD'),
        semana: this.getWeekString(dataMovimentacao),
        tp: 'S',
        tipo: tipoMovimento,
        qtdmov: -volume, // Sempre negativo para saídas
        estaju: null, // Será calculado posteriormente
        historico: this.generateSyntheticHistorico(tipoMovimento),
        documento: null,
        requisicao: null,
        observacao: 'Dados sintéticos gerados',
        _sintetico: true
      };

      movimentos.push(movimento);
    }

    return movimentos;
  }

  generateVolume(isSemanaAlta, isSemanasBaixa) {
    let baseMin = 1;
    let baseMax = 200;

    if (isSemanaAlta) {
      // Picos sazonais: 2-3x maiores
      const multiplicador = 2 + Math.random(); // 2.0 a 3.0
      baseMin = Math.floor(baseMin * multiplicador);
      baseMax = Math.floor(baseMax * multiplicador);
    } else if (isSemanasBaixa) {
      // Vales sazonais: volumes muito baixos
      baseMin = 1;
      baseMax = 5;
    }

    return Math.floor(Math.random() * (baseMax - baseMin + 1)) + baseMin;
  }

  generateSyntheticHistorico(tipo) {
    const numeroAleatorio = Math.floor(Math.random() * 9999) + 1;
    
    if (tipo === 'SA') {
      return `DISPENSACAO TESTE PACIENTE ${numeroAleatorio}`;
    } else if (tipo === 'SU') {
      return `TRANSFERENCIA TESTE UNIDADE ${numeroAleatorio}`;
    }
    
    return `MOVIMENTACAO TESTE ${numeroAleatorio}`;
  }

  getWeekString(date) {
    const year = date.year();
    const week = date.week();
    return `${year}_${week.toString().padStart(2, '0')} ${year}`;
  }

  // Método para validar e calcular estoques sintéticos
  calculateSyntheticStocks(movimentacoesSinteticas, item) {
    // Agrupar por item e unidade
    const itemMovements = movimentacoesSinteticas.filter(m => 
      m.codigo_item === item.codigo_item && m.unidade === item.unidade
    );

    // Ordenar por data
    itemMovements.sort((a, b) => new Date(a.data_movimentacao) - new Date(b.data_movimentacao));

    // Calcular estoque inicial sintético (baseado em volume médio)
    const volumesMedios = itemMovements.map(m => Math.abs(m.qtdmov));
    const volumeMedio = volumesMedios.reduce((sum, v) => sum + v, 0) / volumesMedios.length || 50;
    
    let estoqueAtual = Math.floor(volumeMedio * 10); // Estoque inicial = 10x volume médio

    // Recalcular estoques
    itemMovements.forEach(mov => {
      estoqueAtual += mov.qtdmov; // qtdmov já é negativo para saídas
      mov.estaju = Math.max(0, estoqueAtual); // Não permitir estoque negativo
    });

    return itemMovements;
  }

  // Método de validação dos dados sintéticos
  validateSyntheticData(data) {
    const validations = {
      total_registros: data.movimentacoes_sinteticas.length,
      periodo_valido: moment(data.data_inicio_sintetico).isValid(),
      tipos_validos: data.movimentacoes_sinteticas.every(m => ['SA', 'SU'].includes(m.tipo)),
      datas_validas: data.movimentacoes_sinteticas.every(m => moment(m.data_movimentacao).isValid()),
      volumes_validos: data.movimentacoes_sinteticas.every(m => m.qtdmov < 0 && Math.abs(m.qtdmov) >= 1)
    };

    this.logger.info('Validação dados sintéticos:', validations);

    const isValid = Object.values(validations).every(v => v === true || typeof v === 'number');
    
    if (!isValid) {
      this.logger.warn('Dados sintéticos contêm inconsistências');
    }

    return validations;
  }
}

module.exports = DataSynthesizer; 