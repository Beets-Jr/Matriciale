import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { db } from '../../config/firebase';

// ==================== CONFIGURAÇÕES ====================
const MUNICIPIO = 'Palmares'; // Município a ser atualizado
const CAMINHO_PLANILHA = './src/onboarding/data/[2025_52] Palmares - Base de Movimentações.xlsx';

// Mapeamento de unidades para abas da planilha
const MAPEAMENTO_UNIDADES: { [nomeUnidade: string]: string } = {
  'CAF': 'MetodologiaCAF',
  'Olavo': 'MetodoOlavo',
  'ESF3': 'MetodoESF3'
};

// Chaves a serem DELETADAS do objeto movimentacoes_semanais (se existirem)
const CHAVES_PARA_DELETAR = ['2025_51', '2025_52', '2026_01'];

// Chaves a serem INSERIDAS/ATUALIZADAS (busca automática no cabeçalho da planilha)
const CHAVES_MOVIMENTACOES_INSERIR = ['2025_51'];
// Adicione mais chaves conforme necessário
// const CHAVES_MOVIMENTACOES_INSERIR = ['2025_51', '2025_52', '2026_01'];

// Pasta para salvar relatórios
const PASTA_RELATORIOS = './relatorios';

// ==================== INTERFACES ====================
interface DadosMedicamento {
  unidade: string;
  id: string;
  nome: string;
  cod_item: string;
  classificacao?: string;
  estoque_antes: number | string;
  estoque_depois: number | string;
  movimentacao_antes: any;
  movimentacao_depois: any;
}

interface RelatorioUnidade {
  unidade: string;
  aba: string;
  total_processados: number;
  total_atualizados: number;
  total_nao_encontrados: number;
  medicamentos_nao_encontrados: string[];
}

interface RelatorioGeral {
  municipio: string;
  data_execucao: string;
  chaves_deletadas: string[];
  chaves_inseridas: string[];
  unidades: RelatorioUnidade[];
  total_geral_atualizados: number;
}

// ==================== FUNÇÕES AUXILIARES ====================

/**
 * Normaliza código de item removendo pontos e zeros à esquerda
 */
function normalizarCodigoItem(codigo: string | number): string {
  // 1. Remove tudo que não for dígito (pontos, espaços, traços)
  const apenasNumeros = String(codigo).replace(/\D/g, '');
  
  // 2. Garante que tenha 9 dígitos preenchendo com zeros à esquerda
  // Ex: "1002003" vira "001002003"
  const preenchido = apenasNumeros.padStart(9, '0');
  
  // 3. Fatia a string para inserir os pontos: XXX.XXX.XXX
  return `${preenchido.slice(0, 3)}.${preenchido.slice(3, 6)}.${preenchido.slice(6, 9)}`;
}

/**
 * Detecta dinamicamente os índices das colunas importantes no cabeçalho
 */
function detectarIndicesColunas(cabecalho: any[]): {
  idxClassificacao: number;
  idxNome: number;
  idxCodItem: number;
  idxMovimentacao: number;
  idxTotalGeral: number;
  idxEstoque: number;
  estoqueErrado: boolean;
} | null {
  try {
    // Índices fixos conforme especificação
    const idxClassificacao = 0; // Coluna A
    const idxNome = 1;          // Coluna B
    const idxCodItem = 2;        // Coluna C
    const idxMovimentacao = 3;  // Coluna D (início das movimentações)

    // Busca pela coluna "Total Geral"
    let idxTotalGeral = -1;
    for (let i = 0; i < cabecalho.length; i++) {
      const valor = String(cabecalho[i] || '').toLowerCase().trim();
      if (valor === 'total geral') {
        idxTotalGeral = i;
        break;
      }
    }

    if (idxTotalGeral === -1) {
      console.error('❌ Coluna "Total Geral" não encontrada no cabeçalho');
      return null;
    }

    // Estoque está 13 colunas à direita de "Total Geral"
    const idxEstoque = idxTotalGeral + 13;

    let estoqueErrado = false;
    // Valida se a coluna de estoque tem o nome correto
    const nomeColEstoque = String(cabecalho[idxEstoque] || '').toLowerCase().trim();
    if (nomeColEstoque !== 'estoque') {
      console.warn(`⚠️ Aviso: Coluna no índice ${idxEstoque} deveria ser "Estoque", mas encontrado: "${cabecalho[idxEstoque]}"`);
      estoqueErrado = true;
    }

    return {
      idxClassificacao,
      idxNome,
      idxCodItem,
      idxMovimentacao,
      idxTotalGeral,
      idxEstoque,
      estoqueErrado
    };
  } catch (error) {
    console.error('❌ Erro ao detectar índices das colunas:', error);
    return null;
  }
}

/**
 * Busca os índices das chaves de movimentação no cabeçalho
 */
function buscarIndicesMovimentacoes(
  cabecalho: any[], 
  chaves: string[]
): Map<string, number> | null {
  const mapa = new Map<string, number>();
  
  for (const chave of chaves) {
    let encontrado = false;
    
    for (let i = 0; i < cabecalho.length; i++) {
      const valorCabecalho = String(cabecalho[i] || '').trim();
      
      if (valorCabecalho === chave) {
        mapa.set(chave, i);
        encontrado = true;
        break;
      }
    }
    
    if (!encontrado) {
      console.error(`❌ Chave "${chave}" não encontrada no cabeçalho`);
      return null;
    }
  }
  
  return mapa;
}

/**
 * Cria a pasta de relatórios se não existir
 */
function criarPastaRelatorios() {
  if (!fs.existsSync(PASTA_RELATORIOS)) {
    fs.mkdirSync(PASTA_RELATORIOS, { recursive: true });
    console.log(`📁 Pasta de relatórios criada: ${PASTA_RELATORIOS}`);
  }
}

// ==================== FUNÇÃO PRINCIPAL ====================

async function atualizarMunicipio() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     SCRIPT DE ATUALIZAÇÃO DE MUNICÍPIO - MEDICAMENTOS     ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\n🏙️  Município: ${MUNICIPIO}`);
  console.log(`📊 Planilha: ${CAMINHO_PLANILHA}`);
  console.log(`🗑️  Deletando chaves: ${CHAVES_PARA_DELETAR.join(', ')}`);
  console.log(`📥 Inserindo chaves: ${CHAVES_MOVIMENTACOES_INSERIR.join(', ')}\n`);

  const relatorioGeral: RelatorioGeral = {
    municipio: MUNICIPIO,
    data_execucao: new Date().toISOString(),
    chaves_deletadas: CHAVES_PARA_DELETAR,
    chaves_inseridas: CHAVES_MOVIMENTACOES_INSERIR,
    unidades: [],
    total_geral_atualizados: 0
  };

  const logsDetalhados: DadosMedicamento[] = [];

  try {
    // Carrega a planilha
    console.log('📖 Carregando planilha...');
    const workbook = XLSX.readFile(CAMINHO_PLANILHA);
    console.log('✅ Planilha carregada com sucesso\n');

    // Processa cada unidade
    for (const [nomeUnidade, nomeAba] of Object.entries(MAPEAMENTO_UNIDADES)) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📂 UNIDADE: ${nomeUnidade} (Aba: "${nomeAba}")`);
      console.log('='.repeat(60));

      const relatorioUnidade: RelatorioUnidade = {
        unidade: nomeUnidade,
        aba: nomeAba,
        total_processados: 0,
        total_atualizados: 0,
        total_nao_encontrados: 0,
        medicamentos_nao_encontrados: []
      };

      // Verifica se a aba existe
      const sheet = workbook.Sheets[nomeAba];
      if (!sheet) {
        console.warn(`⚠️  Aba "${nomeAba}" não encontrada. Pulando...`);
        relatorioGeral.unidades.push(relatorioUnidade);
        continue;
      }

      // Converte a planilha em array de linhas
      const linhas: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      if (linhas.length < 2) {
        console.warn(`⚠️  Aba "${nomeAba}" não contém dados suficientes. Pulando...`);
        relatorioGeral.unidades.push(relatorioUnidade);
        continue;
      }

      // Detecta os índices das colunas
      const cabecalho = linhas[0];
      const indices = detectarIndicesColunas(cabecalho);
      if (!indices || indices.estoqueErrado) {
        console.error(`❌ Erro ao detectar colunas na aba "${nomeAba}". Pulando...`);
        relatorioGeral.unidades.push(relatorioUnidade);
        continue;
      }

      // Busca os índices das chaves de movimentação no cabeçalho
      const indicesMovimentacoes = buscarIndicesMovimentacoes(cabecalho, CHAVES_MOVIMENTACOES_INSERIR);
      if (!indicesMovimentacoes) {
        console.error(`❌ Erro ao localizar chaves de movimentação no cabeçalho da aba "${nomeAba}". Pulando...`);
        relatorioGeral.unidades.push(relatorioUnidade);
        continue;
      }

      console.log(`📊 Colunas detectadas:`);
      console.log(`   - Movimentações a inserir:`);
      indicesMovimentacoes.forEach((indiceColuna, chave) => {
        console.log(`      • ${chave}: coluna índice ${indiceColuna}`);
      });
      console.log(`   - Total Geral: coluna índice ${indices.idxTotalGeral}`);
      console.log(`   - Estoque: coluna índice ${indices.idxEstoque}`);

      // Referência para a coleção de medicamentos
      const medicamentosRef = db
        .collection('municipio')
        .doc(MUNICIPIO)
        .collection('unidades')
        .doc(nomeUnidade)
        .collection('medicamentos_unidade');

      // Processa cada linha da planilha (pula o cabeçalho)
      console.log(`\n🔄 Processando medicamentos...`);
      for (let i = 1; i < linhas.length; i++) {
        const linha = linhas[i];
        
        const classificacao = linha[indices.idxClassificacao];
        const nomeItem = linha[indices.idxNome];
        const codItem = linha[indices.idxCodItem];
        const novoEstoque = Number(linha[indices.idxEstoque]) || 0;

        // Valida se a linha tem dados essenciais
        if (!nomeItem || !codItem) continue;

        relatorioUnidade.total_processados++;

        try {
          // Normaliza o código do item para busca
          const codItemNormalizado = normalizarCodigoItem(codItem);

          // Busca o medicamento no banco
          const snapshot = await medicamentosRef
            .where('cod_item', '==', codItemNormalizado)
            .get();

          if (snapshot.empty) {
            // Medicamento não encontrado
            relatorioUnidade.total_nao_encontrados++;
            relatorioUnidade.medicamentos_nao_encontrados.push(
              `${nomeItem} (cod: ${codItem})`
            );
            continue;
          }

          // Atualiza cada documento encontrado
          for (const docSnapshot of snapshot.docs) {
            const docId = docSnapshot.id;
            const dadosAtuais = docSnapshot.data();

            // Captura estado ANTES da atualização
            const dadosLog: DadosMedicamento = {
              unidade: nomeUnidade,
              id: docId,
              nome: dadosAtuais.nome || nomeItem,
              cod_item: codItem,
              // classificacao: classificacao,
              estoque_antes: dadosAtuais.estoque || 0,
              estoque_depois: novoEstoque,
              movimentacao_antes: dadosAtuais.movimentacoes_semanais ? { ...dadosAtuais.movimentacoes_semanais } : {},
              movimentacao_depois: {}
            };
            const movimentacoesAtualizadas = { ...(dadosAtuais.movimentacoes_semanais || {}) };

            // PASSO 1: Deleta as chaves especificadas
            for (const chave of CHAVES_PARA_DELETAR) {
              if (movimentacoesAtualizadas[chave] !== undefined) {
                delete movimentacoesAtualizadas[chave];
              }
            }

            // PASSO 2: Insere/Atualiza as chaves especificadas
            indicesMovimentacoes.forEach((indiceColuna, chave) => {
              const valor = Number(linha[indiceColuna]) || 0;
              movimentacoesAtualizadas[chave] = valor;
            });

            dadosLog.movimentacao_depois = { ...movimentacoesAtualizadas };

            // Atualiza o documento no banco
            await docSnapshot.ref.update({
              // classificacao: classificacao || dadosAtuais.classificacao,
              // nome: nomeItem,
              estoque: novoEstoque,
              movimentacoes_semanais: movimentacoesAtualizadas,
              // data_atualizacao: new Date()
            });

            relatorioUnidade.total_atualizados++;
            logsDetalhados.push(dadosLog);
          }

          // Feedback visual a cada 10 medicamentos processados
          if (relatorioUnidade.total_processados % 10 === 0) {
            process.stdout.write('.');
          }

        } catch (error) {
          console.error(`\n❌ Erro ao processar "${nomeItem}" (cod: ${codItem}):`, error);
        }
      }

      console.log(`\n\n✅ Resumo da Unidade "${nomeUnidade}":`);
      console.log(`   - Total processados: ${relatorioUnidade.total_processados}`);
      console.log(`   - Total atualizados: ${relatorioUnidade.total_atualizados}`);
      console.log(`   - Total não encontrados: ${relatorioUnidade.total_nao_encontrados}`);

      relatorioGeral.unidades.push(relatorioUnidade);
      relatorioGeral.total_geral_atualizados += relatorioUnidade.total_atualizados;
    }

    // ==================== GERA RELATÓRIOS ====================
    console.log(`\n\n${'='.repeat(60)}`);
    console.log('📄 GERANDO RELATÓRIOS');
    console.log('='.repeat(60));

    criarPastaRelatorios();

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Relatório geral
    const caminhoRelatorioGeral = path.join(
      PASTA_RELATORIOS,
      `relatorio_geral_${MUNICIPIO}_${timestamp}.json`
    );
    fs.writeFileSync(
      caminhoRelatorioGeral,
      JSON.stringify(relatorioGeral, null, 2)
    );
    console.log(`✅ Relatório geral salvo: ${caminhoRelatorioGeral}`);

    // Log detalhado de todas as alterações
    const caminhoLogDetalhado = path.join(
      PASTA_RELATORIOS,
      `log_detalhado_${MUNICIPIO}_${timestamp}.json`
    );
    fs.writeFileSync(
      caminhoLogDetalhado,
      JSON.stringify(logsDetalhados, null, 2)
    );
    console.log(`✅ Log detalhado salvo: ${caminhoLogDetalhado}`);

    // ==================== RESUMO FINAL ====================
    console.log(`\n\n╔════════════════════════════════════════════════════════════╗`);
    console.log(`║                    RESUMO FINAL                            ║`);
    console.log(`╚════════════════════════════════════════════════════════════╝`);
    console.log(`\n🏙️  Município: ${MUNICIPIO}`);
    console.log(`📊 Total de medicamentos atualizados: ${relatorioGeral.total_geral_atualizados}`);
    console.log(`\n📋 Detalhes por unidade:`);
    
    for (const unidade of relatorioGeral.unidades) {
      console.log(`\n   ${unidade.unidade}:`);
      console.log(`      - Processados: ${unidade.total_processados}`);
      console.log(`      - Atualizados: ${unidade.total_atualizados}`);
      console.log(`      - Não encontrados: ${unidade.total_nao_encontrados}`);
      
      if (unidade.medicamentos_nao_encontrados.length > 0) {
        console.log(`      - Lista de não encontrados:`);
        unidade.medicamentos_nao_encontrados.slice(0, 5).forEach(med => {
          console.log(`         • ${med}`);
        });
        if (unidade.medicamentos_nao_encontrados.length > 5) {
          console.log(`         ... e mais ${unidade.medicamentos_nao_encontrados.length - 5}`);
        }
      }
    }

    console.log(`\n✅ Processo finalizado com sucesso!`);
    console.log(`📁 Relatórios salvos em: ${PASTA_RELATORIOS}\n`);
    
    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERRO FATAL:', error);
    process.exit(1);
  }
}

// ==================== EXECUÇÃO ====================
atualizarMunicipio();
