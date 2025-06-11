const moment = require('moment');
const _ = require('lodash');

class MatricialeAnalyzer {
  constructor(logger) {
    this.logger = logger;
  }

  calculateMetrics(consolidatedData, balanceteData) {
    this.logger.info('Iniciando cálculo de métricas Matriciale');

    // Filtrar apenas movimentações SA e SU (dispensação e transferência para unidades)
    const movimentacoesFiltradas = consolidatedData.movimentacoes.filter(m => 
      ['SA', 'SU'].includes(m.tipo)
    );

    this.logger.info(`Analisando ${movimentacoesFiltradas.length} movimentações SA/SU`);

    // Agrupar por item/unidade
    const itensGrouped = this.groupByItemUnidade(movimentacoesFiltradas);
    
    // Calcular métricas para cada item
    const itensComMetricas = [];
    
    Object.keys(itensGrouped).forEach(key => {
      const itemData = itensGrouped[key];
      const metrics = this.calculateItemMetrics(itemData, balanceteData);
      if (metrics) {
        itensComMetricas.push(metrics);
      }
    });

    this.logger.info(`Métricas calculadas para ${itensComMetricas.length} itens`);

    return {
      timestamp: new Date().toISOString(),
      total_itens_analisados: itensComMetricas.length,
      metodologia: 'Matriciale',
      periodo_analise: '52 semanas',
      itens: itensComMetricas
    };
  }

  groupByItemUnidade(movimentacoes) {
    const grouped = {};

    movimentacoes.forEach(mov => {
      const key = `${mov.codigo_item}_${mov.unidade}`;
      
      if (!grouped[key]) {
        grouped[key] = {
          codigo_item: mov.codigo_item,
          nome_item: mov.nome_item,
          unidade: mov.unidade,
          id_unidade: mov.id_unidade,
          classificacao: mov.classificacao,
          movimentacoes: []
        };
      }
      
      grouped[key].movimentacoes.push(mov);
    });

    return grouped;
  }

  calculateItemMetrics(itemData, balanceteData) {
    try {
      // Ordenar movimentações por data
      const movimentacoes = itemData.movimentacoes.sort((a, b) => 
        new Date(a.data_movimentacao) - new Date(b.data_movimentacao)
      );

      // Criar colunas temporais (semanas)
      const colunasSemanais = this.createWeeklyColumns(movimentacoes);
      
      // Calcular agregações
      const totalGeral = this.calculateTotalGeral(movimentacoes);
      
      // Calcular medianas estratificadas
      const medianas = this.calculateMedianas(colunasSemanais);
      
      // Calcular contadores
      const contadores = this.calculateContadores(colunasSemanais);
      
      // Determinar máxima
      const maxima = this.calculateMaxima(colunasSemanais);
      
      // Classificar padrão de movimento
      const tpMovimento = this.classifyMovementPattern(contadores, colunasSemanais);
      
      // Calcular método de previsão
      const metodo = this.calculateMethod(tpMovimento, medianas, maxima);
      
      // Buscar estoque sistêmico do balancete
      const estoqueSistemico = this.getEstoqueSistemico(
        itemData.codigo_item, 
        itemData.unidade, 
        balanceteData
      );
      
      // Calcular MetEst e Reposição
      const isCAF = itemData.unidade === 'CAF';
      const metEst = metodo * (isCAF ? 12 : 3); // CAF: 12 semanas, Farmácias: 3 semanas
      const reposicao = Math.max(0, metEst - (estoqueSistemico || 0));

      return {
        codigo_item: itemData.codigo_item,
        nome_item: itemData.nome_item,
        unidade: itemData.unidade,
        id_unidade: itemData.id_unidade,
        classificacao: itemData.classificacao,
        colunas_semanais: colunasSemanais,
        total_geral: totalGeral,
        medianas: medianas,
        maxima: maxima,
        contadores: contadores,
        tp_movimento: tpMovimento,
        metodo: metodo,
        metest: metEst,
        estoque_sistemico: estoqueSistemico || 0,
        reposicao: reposicao,
        valor_unitario: this.getValorUnitario(itemData.codigo_item, itemData.unidade, balanceteData)
      };

    } catch (error) {
      this.logger.error(`Erro ao calcular métricas para ${itemData.codigo_item}: ${error.message}`);
      return null;
    }
  }

  createWeeklyColumns(movimentacoes) {
    const colunas = {};

    movimentacoes.forEach(mov => {
      if (!mov.semana) return;

      if (!colunas[mov.semana]) {
        colunas[mov.semana] = 0;
      }
      
      // Somar quantidades (qtdmov já é negativo para saídas)
      colunas[mov.semana] += Math.abs(mov.qtdmov);
    });

    return colunas;
  }

  calculateTotalGeral(movimentacoes) {
    return movimentacoes.reduce((total, mov) => total + Math.abs(mov.qtdmov), 0);
  }

  calculateMedianas(colunasSemanais) {
    const semanas = Object.keys(colunasSemanais).sort();
    const valores = semanas.map(s => colunasSemanais[s]).filter(v => v > 0);

    if (valores.length === 0) {
      return {
        md04: 0, md08: 0, md12: 0, md16: 0, md26: 0, md52: 0, mdano: 0, mdtt: 0
      };
    }

    return {
      md04: this.calculateMedian(valores.slice(-4)),
      md08: this.calculateMedian(valores.slice(-8)),
      md12: this.calculateMedian(valores.slice(-12)),
      md16: this.calculateMedian(valores.slice(-16)),
      md26: this.calculateMedian(valores.slice(-26)),
      md52: this.calculateMedian(valores.slice(-52)),
      mdano: this.calculateMedianAno(colunasSemanais),
      mdtt: this.calculateMedian(valores)
    };
  }

  calculateMedian(values) {
    if (values.length === 0) return 0;
    
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    
    return sorted.length % 2 === 0 
      ? (sorted[mid - 1] + sorted[mid]) / 2 
      : sorted[mid];
  }

  calculateMedianAno(colunasSemanais) {
    const anoAtual = new Date().getFullYear();
    const semanasAnoAtual = Object.keys(colunasSemanais)
      .filter(s => s.includes(anoAtual.toString()))
      .map(s => colunasSemanais[s])
      .filter(v => v > 0);
    
    return this.calculateMedian(semanasAnoAtual);
  }

  calculateContadores(colunasSemanais) {
    const semanas = Object.keys(colunasSemanais).sort();
    const valores = semanas.map(s => colunasSemanais[s]);

    const countNonNull = (arr) => arr.filter(v => v > 0).length;

    return {
      cont04: countNonNull(valores.slice(-4)),
      cont08: countNonNull(valores.slice(-8)),
      cont12: countNonNull(valores.slice(-12)),
      cont16: countNonNull(valores.slice(-16)),
      cont26: countNonNull(valores.slice(-26)),
      cont52: countNonNull(valores.slice(-52)),
      contano: this.countAnoAtual(colunasSemanais),
      conttt: countNonNull(valores)
    };
  }

  countAnoAtual(colunasSemanais) {
    const anoAtual = new Date().getFullYear();
    return Object.keys(colunasSemanais)
      .filter(s => s.includes(anoAtual.toString()))
      .filter(s => colunasSemanais[s] > 0)
      .length;
  }

  calculateMaxima(colunasSemanais) {
    const valores = Object.values(colunasSemanais).filter(v => v > 0);
    return valores.length > 0 ? Math.max(...valores) : 0;
  }

  classifyMovementPattern(contadores, colunasSemanais) {
    const semanas = Object.keys(colunasSemanais).sort();
    const ultimaSemana = semanas[semanas.length - 1];
    const ultimoValor = colunasSemanais[ultimaSemana];

    // 1. ENTRANTES: Última semana != NULL e ContTt = 1
    if (ultimoValor > 0 && contadores.conttt === 1) {
      return 'ENTRANTES';
    }

    // 2. INATIVOS: Cont16 = 0 (sem movimento 16 semanas)
    if (contadores.cont16 === 0) {
      return 'INATIVOS';
    }

    // 3. RECENTES: (Cont26 / semanas_disponíveis_26) ≥ 0.50
    const semanasDisponiveis26 = Math.min(26, semanas.length);
    if (semanasDisponiveis26 > 0 && (contadores.cont26 / semanasDisponiveis26) >= 0.50) {
      return 'RECENTES';
    }

    // 4. ORDINÁRIOS: (Cont52 / semanas_disponíveis_52) ≥ 0.50
    const semanasDisponiveis52 = Math.min(52, semanas.length);
    if (semanasDisponiveis52 > 0 && (contadores.cont52 / semanasDisponiveis52) >= 0.50) {
      return 'ORDINÁRIOS';
    }

    // 5. INTERMITENTES: (Cont52 / semanas_disponíveis_52) < 0.50
    return 'INTERMITENTES';
  }

  calculateMethod(tpMovimento, medianas, maxima) {
    switch (tpMovimento) {
      case 'ENTRANTES':
        // Valor da única ocorrência - usar mediana total
        return medianas.mdtt;
        
      case 'INATIVOS':
        return 0;
        
      case 'INTERMITENTES':
        return Math.max(1, Math.floor(maxima / 4));
        
      case 'ORDINÁRIOS':
      case 'RECENTES':
        // max(Md04, Md08, Md12, Md16, Md26, Md52, MdAno, MdTt)
        return Math.max(
          medianas.md04,
          medianas.md08,
          medianas.md12,
          medianas.md16,
          medianas.md26,
          medianas.md52,
          medianas.mdano,
          medianas.mdtt
        );
        
      default:
        return 0;
    }
  }

  getEstoqueSistemico(codigoItem, unidade, balanceteData) {
    if (!balanceteData.itens) return 0;

    if (unidade === 'CAF') {
      // Para CAF: soma de todas as unidades
      return balanceteData.itens
        .filter(item => item.cod_sistemico_item === codigoItem)
        .reduce((soma, item) => soma + (item.qtd_periodo_final || 0), 0);
    } else {
      // Para farmácias específicas
      const item = balanceteData.itens.find(item => 
        item.cod_sistemico_item === codigoItem && 
        item.unidade === unidade
      );
      return item ? (item.qtd_periodo_final || 0) : 0;
    }
  }

  getValorUnitario(codigoItem, unidade, balanceteData) {
    if (!balanceteData.itens) return 0;

    const item = balanceteData.itens.find(item => 
      item.cod_sistemico_item === codigoItem && 
      (item.unidade === unidade || unidade === 'CAF')
    );
    
    return item ? (item.val_unit_periodo_final || 0) : 0;
  }

  // Método para auditoria e validação
  validateMetrics(metrics) {
    const validations = {
      total_itens: metrics.itens.length,
      itens_com_reposicao: metrics.itens.filter(i => i.reposicao > 0).length,
      distribuicao_tp_movimento: this.countByField(metrics.itens, 'tp_movimento'),
      distribuicao_classificacao: this.countByField(metrics.itens, 'classificacao'),
      valor_total_reposicao: metrics.itens.reduce((sum, i) => sum + (i.reposicao * i.valor_unitario), 0)
    };

    this.logger.info('Validação de métricas:', validations);
    return validations;
  }

  countByField(items, field) {
    return items.reduce((counts, item) => {
      const value = item[field] || 'Não Definido';
      counts[value] = (counts[value] || 0) + 1;
      return counts;
    }, {});
  }

  // Método para gerar dados de auditoria
  generateAuditData(metrics) {
    return {
      timestamp: new Date().toISOString(),
      resumo_geral: this.validateMetrics(metrics),
      amostras_calculo: metrics.itens.slice(0, 5), // Primeiros 5 para auditoria
      alertas: this.generateAlerts(metrics.itens)
    };
  }

  generateAlerts(itens) {
    const alerts = [];
    
    // Alertas para itens com reposição alta
    const reposicoesAltas = itens.filter(i => i.reposicao > 1000);
    if (reposicoesAltas.length > 0) {
      alerts.push({
        tipo: 'REPOSICAO_ALTA',
        quantidade: reposicoesAltas.length,
        itens: reposicoesAltas.slice(0, 3).map(i => i.nome_item)
      });
    }

    // Alertas para itens inativos
    const inativos = itens.filter(i => i.tp_movimento === 'INATIVOS');
    if (inativos.length > 0) {
      alerts.push({
        tipo: 'ITENS_INATIVOS',
        quantidade: inativos.length,
        percentual: ((inativos.length / itens.length) * 100).toFixed(1) + '%'
      });
    }

    return alerts;
  }
}

module.exports = MatricialeAnalyzer; 