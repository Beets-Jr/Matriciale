const XLSX = require('xlsx');
const path = require('path');

class ReportGenerator {
  constructor(logger) {
    this.logger = logger;
  }

  async generateReports(metrics, outputDir, timestamp) {
    this.logger.info('Iniciando geração de relatórios Excel');

    try {
      // 1. Relatórios de Reposição por Farmácia
      await this.generateFarmaciaReports(metrics, outputDir, timestamp);
      
      // 2. Relatório CAF
      await this.generateCAFReport(metrics, outputDir, timestamp);
      
      // 3. Dashboard Executivo
      await this.generateDashboard(metrics, outputDir, timestamp);
      
      // 4. Auditoria de Cálculos
      await this.generateAuditReport(metrics, outputDir, timestamp);

      this.logger.info('Todos os relatórios Excel foram gerados com sucesso');

    } catch (error) {
      this.logger.error(`Erro na geração de relatórios: ${error.message}`);
      throw error;
    }
  }

  async generateFarmaciaReports(metrics, outputDir, timestamp) {
    const farmacias = this.getFarmacias(metrics.itens);

    for (const farmacia of farmacias) {
      const itensFiltered = metrics.itens.filter(item => 
        item.unidade === farmacia && item.unidade !== 'CAF'
      );

      if (itensFiltered.length === 0) continue;

      const workbook = XLSX.utils.book_new();
      
      // Preparar dados para Excel
      const excelData = this.prepareExcelData(itensFiltered, false);
      
      // Criar worksheet
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      // Aplicar formatação
      this.formatWorksheet(worksheet, excelData);
      
      // Adicionar ao workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, farmacia.replace('Farmácia ', ''));
      
      // Salvar arquivo
      const filename = `reposicao_farmacia_${farmacia.replace(/\s+/g, '_')}_${timestamp}.xlsx`;
      const filepath = path.join(outputDir, filename);
      
      XLSX.writeFile(workbook, filepath);
      this.logger.info(`Relatório gerado: ${filename}`);
    }
  }

  async generateCAFReport(metrics, outputDir, timestamp) {
    // Calcular métricas consolidadas para CAF
    const itensCAF = this.calculateCAFMetrics(metrics.itens);

    const workbook = XLSX.utils.book_new();
    
    const excelData = this.prepareExcelData(itensCAF, true);
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    
    this.formatWorksheet(worksheet, excelData);
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reposição CAF');
    
    const filename = `reposicao_caf_${timestamp}.xlsx`;
    const filepath = path.join(outputDir, filename);
    
    XLSX.writeFile(workbook, filepath);
    this.logger.info(`Relatório CAF gerado: ${filename}`);
  }

  async generateDashboard(metrics, outputDir, timestamp) {
    const workbook = XLSX.utils.book_new();

    // Aba 1: Resumo Geral
    const resumoData = this.prepareResumoGeral(metrics);
    const resumoWS = XLSX.utils.json_to_sheet(resumoData);
    XLSX.utils.book_append_sheet(workbook, resumoWS, 'Resumo Geral');

    // Aba 2: Top Reposições
    const topReposicoes = this.prepareTopReposicoes(metrics.itens);
    const topWS = XLSX.utils.json_to_sheet(topReposicoes);
    XLSX.utils.book_append_sheet(workbook, topWS, 'Top Reposições');

    // Aba 3: Análise por Classificação
    const classiAnalysis = this.prepareClassificacaoAnalysis(metrics.itens);
    const classiWS = XLSX.utils.json_to_sheet(classiAnalysis);
    XLSX.utils.book_append_sheet(workbook, classiWS, 'Análise por Classificação');

    // Aba 4: Farmácias Críticas
    const farmaciasCriticas = this.prepareFarmaciasCriticas(metrics.itens);
    const farmWS = XLSX.utils.json_to_sheet(farmaciasCriticas);
    XLSX.utils.book_append_sheet(workbook, farmWS, 'Farmácias Críticas');

    // Aba 5: Tendências
    const tendencias = this.prepareTendencias(metrics.itens);
    const tendWS = XLSX.utils.json_to_sheet(tendencias);
    XLSX.utils.book_append_sheet(workbook, tendWS, 'Tendências');

    const filename = `dashboard_executivo_${timestamp}.xlsx`;
    const filepath = path.join(outputDir, filename);
    
    XLSX.writeFile(workbook, filepath);
    this.logger.info(`Dashboard executivo gerado: ${filename}`);
  }

  async generateAuditReport(metrics, outputDir, timestamp) {
    const workbook = XLSX.utils.book_new();

    // Aba 1: Validação Medianas
    const validacaoMedianas = this.prepareValidacaoMedianas(metrics.itens);
    const valWS = XLSX.utils.json_to_sheet(validacaoMedianas);
    XLSX.utils.book_append_sheet(workbook, valWS, 'Validação Medianas');

    // Aba 2: Dados Sintéticos (amostra)
    const dadosSinteticos = this.prepareDadosSinteticos(metrics.itens);
    const sintWS = XLSX.utils.json_to_sheet(dadosSinteticos);
    XLSX.utils.book_append_sheet(workbook, sintWS, 'Dados Sintéticos');

    // Aba 3: Classificações
    const classificacoes = this.prepareClassificacoes(metrics.itens);
    const classWS = XLSX.utils.json_to_sheet(classificacoes);
    XLSX.utils.book_append_sheet(workbook, classWS, 'Classificações');

    // Aba 4: Erros e Alertas
    const alertas = this.prepareAlertas(metrics.itens);
    const alertWS = XLSX.utils.json_to_sheet(alertas);
    XLSX.utils.book_append_sheet(workbook, alertWS, 'Erros e Alertas');

    const filename = `auditoria_calculos_${timestamp}.xlsx`;
    const filepath = path.join(outputDir, filename);
    
    XLSX.writeFile(workbook, filepath);
    this.logger.info(`Relatório de auditoria gerado: ${filename}`);
  }

  prepareExcelData(itens, isCAF) {
    return itens.map(item => {
      const baseData = {
        'Classificação': item.classificacao,
        'Código do Item': item.codigo_item,
        'Nome do Item': item.nome_item
      };

      // Adicionar ID Unidade e Unidade apenas para farmácias
      if (!isCAF) {
        baseData['ID Unidade'] = item.id_unidade;
        baseData['Unidade'] = item.unidade;
      }

      // Adicionar colunas semanais dinâmicas
      const colunasSemanais = {};
      if (item.colunas_semanais) {
        Object.keys(item.colunas_semanais).sort().forEach(semana => {
          colunasSemanais[semana] = item.colunas_semanais[semana] || null;
        });
      }

      // Métricas calculadas
      const metricas = {
        'Total Geral': item.total_geral || 0,
        'Md04': item.medianas?.md04 || 0,
        'Md08': item.medianas?.md08 || 0,
        'Md12': item.medianas?.md12 || 0,
        'Md16': item.medianas?.md16 || 0,
        'Md26': item.medianas?.md26 || 0,
        'Md52': item.medianas?.md52 || 0,
        'MdAno': item.medianas?.mdano || 0,
        'MdTt': item.medianas?.mdtt || 0,
        'Máxima': item.maxima || 0,
        'Cont04': item.contadores?.cont04 || 0,
        'Cont08': item.contadores?.cont08 || 0,
        'Cont12': item.contadores?.cont12 || 0,
        'Cont16': item.contadores?.cont16 || 0,
        'Cont26': item.contadores?.cont26 || 0,
        'Cont52': item.contadores?.cont52 || 0,
        'ContAno': item.contadores?.contano || 0,
        'ContTt': item.contadores?.conttt || 0,
        'TP_Movimento': item.tp_movimento || '',
        'MÉTODO': item.metodo || 0,
        'MetEst': item.metest || 0,
        'Estoque sistêmico': item.estoque_sistemico || 0,
        'Reposição': item.reposicao || 0
      };

      return {
        ...baseData,
        ...colunasSemanais,
        ...metricas
      };
    });
  }

  calculateCAFMetrics(itens) {
    // Agrupar itens por código para consolidar para CAF
    const itensGrouped = itens.reduce((acc, item) => {
      if (!acc[item.codigo_item]) {
        acc[item.codigo_item] = {
          codigo_item: item.codigo_item,
          nome_item: item.nome_item,
          classificacao: item.classificacao,
          // Consolidar colunas semanais (somar valores)
          colunas_semanais: {},
          // Recalcular métricas baseado na consolidação
          estoque_sistemico_total: 0,
          valor_unitario: item.valor_unitario || 0,
          itens_origem: []
        };
      }

      // Somar estoques sistêmicos
      acc[item.codigo_item].estoque_sistemico_total += item.estoque_sistemico;
      
      // Consolidar colunas semanais
      if (item.colunas_semanais) {
        Object.keys(item.colunas_semanais).forEach(semana => {
          if (!acc[item.codigo_item].colunas_semanais[semana]) {
            acc[item.codigo_item].colunas_semanais[semana] = 0;
          }
          acc[item.codigo_item].colunas_semanais[semana] += item.colunas_semanais[semana];
        });
      }

      acc[item.codigo_item].itens_origem.push(item);
      return acc;
    }, {});

    // Recalcular métricas para cada item consolidado
    return Object.values(itensGrouped).map(itemConsolidado => {
      // Recalcular medianas baseado nas colunas consolidadas
      const semanas = Object.keys(itemConsolidado.colunas_semanais).sort();
      const valores = semanas.map(s => itemConsolidado.colunas_semanais[s]).filter(v => v > 0);

      const medianas = this.recalculateMedianas(valores);
      const contadores = this.recalculateContadores(itemConsolidado.colunas_semanais);
      const maxima = valores.length > 0 ? Math.max(...valores) : 0;
      const totalGeral = valores.reduce((sum, v) => sum + v, 0);

      // Reclassificar padrão de movimento
      const tpMovimento = this.reclassifyMovementPattern(contadores, itemConsolidado.colunas_semanais);
      
      // Recalcular método
      const metodo = this.recalculateMethod(tpMovimento, medianas, maxima);
      
      // Calcular MetEst para CAF (12 semanas)
      const metest = metodo * 12;
      const reposicao = Math.max(0, metest - itemConsolidado.estoque_sistemico_total);

      return {
        codigo_item: itemConsolidado.codigo_item,
        nome_item: itemConsolidado.nome_item,
        classificacao: itemConsolidado.classificacao,
        colunas_semanais: itemConsolidado.colunas_semanais,
        total_geral: totalGeral,
        medianas: medianas,
        maxima: maxima,
        contadores: contadores,
        tp_movimento: tpMovimento,
        metodo: metodo,
        metest: metest,
        estoque_sistemico: itemConsolidado.estoque_sistemico_total,
        reposicao: reposicao,
        valor_unitario: itemConsolidado.valor_unitario
      };
    });
  }

  formatWorksheet(worksheet, data) {
    if (!data || data.length === 0) return;

    const range = XLSX.utils.decode_range(worksheet['!ref']);
    
    // Aplicar formatação condicional para reposições > 0
    for (let R = range.s.r + 1; R <= range.e.r; R++) {
      const reposicaoCol = this.findColumnIndex(data, 'Reposição');
      if (reposicaoCol >= 0) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: reposicaoCol });
        const cell = worksheet[cellAddress];
        if (cell && cell.v > 0) {
          cell.s = {
            fill: {
              fgColor: { rgb: "FFFF00" } // Amarelo para reposições > 0
            }
          };
        }
      }
    }

    // Configurar filtros automáticos
    worksheet['!autofilter'] = { ref: worksheet['!ref'] };
  }

  findColumnIndex(data, columnName) {
    if (!data || data.length === 0) return -1;
    const firstRow = data[0];
    const keys = Object.keys(firstRow);
    return keys.indexOf(columnName);
  }

  getFarmacias(itens) {
    const farmacias = new Set();
    itens.forEach(item => {
      if (item.unidade && item.unidade !== 'CAF') {
        farmacias.add(item.unidade);
      }
    });
    return Array.from(farmacias);
  }

  // Métodos auxiliares para recálculos do CAF
  recalculateMedianas(valores) {
    if (valores.length === 0) {
      return { md04: 0, md08: 0, md12: 0, md16: 0, md26: 0, md52: 0, mdano: 0, mdtt: 0 };
    }

    return {
      md04: this.calculateMedian(valores.slice(-4)),
      md08: this.calculateMedian(valores.slice(-8)),
      md12: this.calculateMedian(valores.slice(-12)),
      md16: this.calculateMedian(valores.slice(-16)),
      md26: this.calculateMedian(valores.slice(-26)),
      md52: this.calculateMedian(valores.slice(-52)),
      mdano: this.calculateMedian(valores), // Simplificado
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

  recalculateContadores(colunasSemanais) {
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
      contano: countNonNull(valores), // Simplificado
      conttt: countNonNull(valores)
    };
  }

  reclassifyMovementPattern(contadores, colunasSemanais) {
    const semanas = Object.keys(colunasSemanais).sort();
    const ultimaSemana = semanas[semanas.length - 1];
    const ultimoValor = colunasSemanais[ultimaSemana];

    if (ultimoValor > 0 && contadores.conttt === 1) return 'ENTRANTES';
    if (contadores.cont16 === 0) return 'INATIVOS';
    
    const semanasDisponiveis26 = Math.min(26, semanas.length);
    if (semanasDisponiveis26 > 0 && (contadores.cont26 / semanasDisponiveis26) >= 0.50) {
      return 'RECENTES';
    }
    
    const semanasDisponiveis52 = Math.min(52, semanas.length);
    if (semanasDisponiveis52 > 0 && (contadores.cont52 / semanasDisponiveis52) >= 0.50) {
      return 'ORDINÁRIOS';
    }
    
    return 'INTERMITENTES';
  }

  recalculateMethod(tpMovimento, medianas, maxima) {
    switch (tpMovimento) {
      case 'ENTRANTES': return medianas.mdtt;
      case 'INATIVOS': return 0;
      case 'INTERMITENTES': return Math.max(1, Math.floor(maxima / 4));
      case 'ORDINÁRIOS':
      case 'RECENTES':
        return Math.max(
          medianas.md04, medianas.md08, medianas.md12, medianas.md16,
          medianas.md26, medianas.md52, medianas.mdano, medianas.mdtt
        );
      default: return 0;
    }
  }

  // Métodos para preparar dados das abas do dashboard
  prepareResumoGeral(metrics) {
    const itens = metrics.itens;
    return [{
      'Métrica': 'Total de Itens Analisados',
      'Valor': itens.length
    }, {
      'Métrica': 'Itens com Reposição',
      'Valor': itens.filter(i => i.reposicao > 0).length
    }, {
      'Métrica': 'Valor Total de Reposição',
      'Valor': itens.reduce((sum, i) => sum + (i.reposicao * i.valor_unitario), 0)
    }, {
      'Métrica': 'Itens Inativos',
      'Valor': itens.filter(i => i.tp_movimento === 'INATIVOS').length
    }];
  }

  prepareTopReposicoes(itens) {
    return itens
      .filter(i => i.reposicao > 0)
      .sort((a, b) => b.reposicao - a.reposicao)
      .slice(0, 20)
      .map(item => ({
        'Código': item.codigo_item,
        'Nome': item.nome_item,
        'Unidade': item.unidade,
        'Classificação': item.classificacao,
        'Reposição': item.reposicao,
        'Valor Unitário': item.valor_unitario,
        'Valor Total': item.reposicao * item.valor_unitario
      }));
  }

  prepareClassificacaoAnalysis(itens) {
    const grupos = itens.reduce((acc, item) => {
      const classe = item.classificacao || 'Não Classificado';
      if (!acc[classe]) {
        acc[classe] = { total: 0, com_reposicao: 0, valor_total: 0 };
      }
      acc[classe].total++;
      if (item.reposicao > 0) {
        acc[classe].com_reposicao++;
        acc[classe].valor_total += item.reposicao * item.valor_unitario;
      }
      return acc;
    }, {});

    return Object.keys(grupos).map(classe => ({
      'Classificação': classe,
      'Total Itens': grupos[classe].total,
      'Itens com Reposição': grupos[classe].com_reposicao,
      'Valor Total Reposição': grupos[classe].valor_total
    }));
  }

  prepareFarmaciasCriticas(itens) {
    const farmacias = itens.reduce((acc, item) => {
      if (item.unidade === 'CAF') return acc;
      
      if (!acc[item.unidade]) {
        acc[item.unidade] = { total_itens: 0, itens_reposicao: 0, valor_total: 0 };
      }
      acc[item.unidade].total_itens++;
      if (item.reposicao > 0) {
        acc[item.unidade].itens_reposicao++;
        acc[item.unidade].valor_total += item.reposicao * item.valor_unitario;
      }
      return acc;
    }, {});

    return Object.keys(farmacias).map(farmacia => ({
      'Farmácia': farmacia,
      'Total Itens': farmacias[farmacia].total_itens,
      'Itens com Reposição': farmacias[farmacia].itens_reposicao,
      'Valor Total': farmacias[farmacia].valor_total,
      'Percentual Reposição': ((farmacias[farmacia].itens_reposicao / farmacias[farmacia].total_itens) * 100).toFixed(1) + '%'
    }));
  }

  prepareTendencias(itens) {
    const tpDistribution = itens.reduce((acc, item) => {
      const tp = item.tp_movimento || 'Não Definido';
      acc[tp] = (acc[tp] || 0) + 1;
      return acc;
    }, {});

    return Object.keys(tpDistribution).map(tp => ({
      'Padrão de Movimento': tp,
      'Quantidade': tpDistribution[tp],
      'Percentual': ((tpDistribution[tp] / itens.length) * 100).toFixed(1) + '%'
    }));
  }

  prepareValidacaoMedianas(itens) {
    return itens.slice(0, 10).map(item => ({
      'Código': item.codigo_item,
      'Nome': item.nome_item,
      'Md04': item.medianas?.md04 || 0,
      'Md08': item.medianas?.md08 || 0,
      'Md12': item.medianas?.md12 || 0,
      'Md52': item.medianas?.md52 || 0,
      'Método': item.metodo || 0,
      'TP Movimento': item.tp_movimento || ''
    }));
  }

  prepareDadosSinteticos(itens) {
    // Simular dados sintéticos (na implementação real, estes viriam do DataSynthesizer)
    return [{
      'Informação': 'Dados sintéticos foram gerados para 52 semanas anteriores aos dados reais',
      'Frequência': '70% de chance por item/semana',
      'Tipos': 'SA e SU apenas',
      'Volume': 'Entre 1 e 200 unidades'
    }];
  }

  prepareClassificacoes(itens) {
    return itens.slice(0, 20).map(item => ({
      'Código': item.codigo_item,
      'Nome': item.nome_item,
      'Classificação': item.classificacao,
      'TP Movimento': item.tp_movimento,
      'Justificativa': this.getClassificationJustification(item.tp_movimento, item.contadores)
    }));
  }

  getClassificationJustification(tpMovimento, contadores) {
    switch (tpMovimento) {
      case 'ENTRANTES': return 'Última semana ativa e ContTt = 1';
      case 'INATIVOS': return 'Cont16 = 0 (sem movimento 16 semanas)';
      case 'RECENTES': return 'Cont26/semanas >= 50%';
      case 'ORDINÁRIOS': return 'Cont52/semanas >= 50%';
      case 'INTERMITENTES': return 'Cont52/semanas < 50%';
      default: return 'Não classificado';
    }
  }

  prepareAlertas(itens) {
    const alertas = [];
    
    // Reposições altas
    const reposicoesAltas = itens.filter(i => i.reposicao > 1000);
    reposicoesAltas.forEach(item => {
      alertas.push({
        'Tipo': 'REPOSIÇÃO ALTA',
        'Item': item.nome_item,
        'Unidade': item.unidade,
        'Valor': item.reposicao,
        'Observação': 'Reposição acima de 1000 unidades'
      });
    });

    // Itens sem movimento
    const inativos = itens.filter(i => i.tp_movimento === 'INATIVOS');
    inativos.slice(0, 10).forEach(item => {
      alertas.push({
        'Tipo': 'ITEM INATIVO',
        'Item': item.nome_item,
        'Unidade': item.unidade,
        'Valor': 0,
        'Observação': 'Sem movimento há 16+ semanas'
      });
    });

    return alertas;
  }
}

module.exports = ReportGenerator; 