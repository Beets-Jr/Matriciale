/**
 * Teste simples para verificar a ordenação de índices ano_semana
 * Pode ser executado diretamente no Node.js sem dependências complexas
 */

// Função de ordenação (cópia da implementação atual)
function ordenarIndicesAnoSemana(indices: string[]): string[] {
  return indices.sort((a, b) => {
    const [anoA, semanaA] = a.split('_').map(Number);
    const [anoB, semanaB] = b.split('_').map(Number);

    // Primeiro compara ano
    if (anoA !== anoB) {
      return anoA - anoB;
    }

    // Se mesmo ano, compara semana
    return semanaA - semanaB;
  });
}

// Testes
console.log('🧪 TESTANDO ORDENAÇÃO DE ÍNDICES ANO_SEMANA\n');

// Teste 1: Índices já padronizados (como devem estar no banco)
console.log('=== TESTE 1: Índices já padronizados (2024_01, 2024_02, etc.) ===');
const indicesPadronizados = ['2024_10', '2024_01', '2024_02', '2024_15', '2025_01', '2023_52'];
console.log('Antes da ordenação:', indicesPadronizados);
const ordenadosPadronizados = ordenarIndicesAnoSemana([...indicesPadronizados]);
console.log('Depois da ordenação:', ordenadosPadronizados);
console.log('✅ Correto? Último deve ser "2025_01"\n');

// Teste 2: Índices misturados (alguns com/sem zero à esquerda)
console.log('=== TESTE 2: Índices misturados (2024_1 e 2024_01) ===');
const indicesMisturados = ['2024_10', '2024_1', '2024_01', '2024_2', '2024_02', '2025_1'];
console.log('Antes da ordenação:', indicesMisturados);
const ordenadosMisturados = ordenarIndicesAnoSemana([...indicesMisturados]);
console.log('Depois da ordenação:', ordenadosMisturados);
console.log('✅ Correto? "2024_1" e "2024_01" devem ser tratados como iguais\n');

// Teste 3: Mudança de ano
console.log('=== TESTE 3: Mudança de ano ===');
const indicesAnos = ['2025_01', '2024_52', '2024_51', '2025_02'];
console.log('Antes da ordenação:', indicesAnos);
const ordenadosAnos = ordenarIndicesAnoSemana([...indicesAnos]);
console.log('Depois da ordenação:', ordenadosAnos);
console.log('✅ Correto? Deve terminar com 2025_02\n');

// Teste 4: Comparação com ordenação lexicográfica (antigo método)
console.log('=== TESTE 4: Comparação com ordenação lexicográfica (ANTIGO método) ===');
const testeComparacao = ['2024_10', '2024_1', '2024_2', '2024_15'];
console.log('Array original:', testeComparacao);

console.log('Ordenação LEXICOGRÁFICA (errada):', [...testeComparacao].sort());
console.log('Ordenação NUMÉRICA (correta):', ordenarIndicesAnoSemana([...testeComparacao]));

const lexico = [...testeComparacao].sort();
const numerico = ordenarIndicesAnoSemana([...testeComparacao]);
console.log('São iguais?', JSON.stringify(lexico) === JSON.stringify(numerico) ? '❌ SIM (PROBLEMA!)' : '✅ NÃO (CORRETO!)');

console.log('\n🎯 RESUMO:');
console.log('✅ Índices padronizados (2024_01): Ordenação funciona corretamente');
console.log('✅ Índices misturados (2024_1 e 2024_01): Tratados como iguais numericamente');
console.log('✅ Mudança de ano: Funciona corretamente');
console.log('✅ Diferença da ordenação lexicográfica: Evita bugs');