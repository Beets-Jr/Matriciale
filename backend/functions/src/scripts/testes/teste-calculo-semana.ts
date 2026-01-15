import { calcularProximoIndiceAnoSemana } from '../utils/utils';

console.log('🧪 TESTANDO CÁLCULO DE PRÓXIMA SEMANA\n');

// Teste 1: Ordem que seria incorreta com ordenação lexicográfica
console.log('=== TESTE 1: Ordem incorreta (lexicográfica) ===');
const teste1 = { '2025_10': 0, '2025_2': 0, '2025_1': 0 };
console.log('Input (chaves):', Object.keys(teste1));
console.log('Próxima semana:', calcularProximoIndiceAnoSemana(teste1));
console.log('✅ Esperado: 2025_11 (baseado no maior: 2025_10)\n');

// Teste 2: Ordem correta
console.log('=== TESTE 2: Ordem correta (numérica) ===');
const teste2 = { '2025_1': 0, '2025_2': 0, '2025_10': 0 };
console.log('Input (chaves):', Object.keys(teste2));
console.log('Próxima semana:', calcularProximoIndiceAnoSemana(teste2));
console.log('✅ Esperado: 2025_11\n');

// Teste 3: Mudança de ano
console.log('=== TESTE 3: Mudança de ano ===');
const teste3 = { '2025_52': 0, '2025_51': 0 };
console.log('Input (chaves):', Object.keys(teste3));
console.log('Próxima semana:', calcularProximoIndiceAnoSemana(teste3));
console.log('✅ Esperado: 2026_01\n');

// Teste 4: Sem histórico
console.log('=== TESTE 4: Sem histórico ===');
const teste4 = {};
console.log('Input (chaves):', Object.keys(teste4));
console.log('Próxima semana:', calcularProximoIndiceAnoSemana(teste4));
console.log('✅ Esperado: Semana atual baseada na data\n');

// Teste 5: Anos diferentes
console.log('=== TESTE 5: Anos diferentes ===');
const teste5 = { '2024_52': 0, '2025_1': 0, '2025_2': 0 };
console.log('Input (chaves):', Object.keys(teste5));
console.log('Próxima semana:', calcularProximoIndiceAnoSemana(teste5));
console.log('✅ Esperado: 2025_03\n');

console.log('✅ Todos os testes executados!');