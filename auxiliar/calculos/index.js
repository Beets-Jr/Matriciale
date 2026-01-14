const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

// ================= CONFIGURAÇÕES =================
// Nome do arquivo Excel na raiz do projeto
const EXCEL_FILE = '[COMPLETO] Palmares - Base de Movimentações.xlsx'; 

// Nome da aba a ser processada (ex: 'MetodologiaCAF', 'MetodoOlavo', 'MetodoESF3')
const TARGET_SHEET = 'MetodologiaCAF'; 

// Nome do arquivo JSON de comparação
const JSON_FILE = 'lista_CAF.json'; 

// Arquivo de saída
const OUTPUT_FILE = 'relatorio_divergencias_excel.txt';
// =================================================

// Função para limpar números vindos do Excel ou JSON
function limparNumero(val) {
    if (val === undefined || val === null || val === '') return 0;
    if (typeof val === 'number') return val;
    // Remove pontos de milhar e substitui virgula por ponto
    let str = String(val).replace(/\./g, '').replace(',', '.');
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
}

// Função para formatar o COD_ITEM do Excel (5000022 -> 005.000.022)
function formatarCodItem(valorBruto) {
    if (!valorBruto) return "";
    
    // Remove pontos existentes e converte para string
    let limpo = String(valorBruto).replace(/\./g, '').replace(/\-/g, '').trim();
    
    // Garante 9 dígitos preenchendo com zeros à esquerda
    const preenchido = limpo.padStart(9, '0');
    
    // Aplica a máscara XXX.XXX.XXX
    // (Grupo 1 de 3 digitos).(Grupo 2 de 3 digitos).(Grupo 3 de 3 digitos)
    return preenchido.replace(/(\d{3})(\d{3})(\d{3})/, '$1.$2.$3');
}

function main() {
    try {
        console.log(`\n=== INICIANDO COMPARAÇÃO ===`);
        console.log(`Excel: ${EXCEL_FILE} [Aba: ${TARGET_SHEET}]`);
        console.log(`JSON:  ${JSON_FILE}`);

        // 1. LER ARQUIVO JSON
        const jsonPath = path.join(__dirname, JSON_FILE);
        if (!fs.existsSync(jsonPath)) throw new Error(`Arquivo JSON não encontrado: ${JSON_FILE}`);
        const rawJson = fs.readFileSync(jsonPath, 'utf-8');
        const listaJson = JSON.parse(rawJson);
        console.log(`✅ JSON carregado: ${listaJson.length} itens.`);

        // 2. LER ARQUIVO EXCEL
        const excelPath = path.join(__dirname, EXCEL_FILE);
        if (!fs.existsSync(excelPath)) throw new Error(`Arquivo Excel não encontrado: ${EXCEL_FILE}`);
        
        const workbook = xlsx.readFile(excelPath);
        if (!workbook.Sheets[TARGET_SHEET]) throw new Error(`Aba "${TARGET_SHEET}" não encontrada no Excel.`);
        
        const worksheet = workbook.Sheets[TARGET_SHEET];
        
        // Converte a planilha para uma matriz (array de arrays) para facilitar navegação por índices
        // header: 1 garante que recebemos um array bruto, onde o índice 0 é o cabeçalho
        const dadosExcel = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (dadosExcel.length < 2) throw new Error("A planilha parece estar vazia ou sem cabeçalho.");

        // 3. IDENTIFICAR COLUNAS DINAMICAMENTE
        const headerRow = dadosExcel[0]; // Primeira linha contém os titulos
        
        // Procura onde começa a parte de cálculos baseando-se no "Total Geral"
        // Normaliza para lowercase para evitar erros de digitação (Total geral, TOTAL GERAL, etc)
        const indexTotalGeral = headerRow.findIndex(h => h && String(h).toLowerCase().includes('total geral'));

        if (indexTotalGeral === -1) {
            throw new Error("Coluna 'Total Geral' não encontrada. Não foi possível mapear as colunas dinâmicas.");
        }

        console.log(`ℹ️ Coluna 'Total Geral' identificada no índice ${indexTotalGeral}.`);

        // Mapeamento relativo à coluna Total Geral
        // Baseado na ordem informada: DR(Total), DS(Md04)... até EQ(Fx_Giro)
        const colMap = {
            TotalGeral: indexTotalGeral,
            Md04: indexTotalGeral + 1,
            Md08: indexTotalGeral + 2,
            Md12: indexTotalGeral + 3,
            Md16: indexTotalGeral + 4,
            Md26: indexTotalGeral + 5,
            Md52: indexTotalGeral + 6,
            MdAno: indexTotalGeral + 7,
            MdTt: indexTotalGeral + 8,
            Maximo: indexTotalGeral + 9,
            TP_Metodo: indexTotalGeral + 10,
            Metodo: indexTotalGeral + 11,
            MetEst: indexTotalGeral + 12,
            Estoque: indexTotalGeral + 13,
            Reposicao: indexTotalGeral + 14,
            Cont04: indexTotalGeral + 15,
            Cont08: indexTotalGeral + 16,
            Cont12: indexTotalGeral + 17,
            Cont16: indexTotalGeral + 18,
            Cont26: indexTotalGeral + 19,
            Cont52: indexTotalGeral + 20,
            ContAno: indexTotalGeral + 21,
            ContTotal: indexTotalGeral + 22,
            Giro: indexTotalGeral + 23,
            Fx_Giro: indexTotalGeral + 24
        };

        // 4. MAPEAR DADOS DO EXCEL PARA MEMÓRIA
        const mapExcel = new Map();

        // Começa do índice 1 (pula cabeçalho)
        for (let i = 1; i < dadosExcel.length; i++) {
            const linha = dadosExcel[i];
            
            // Coluna C é COD_ITEM (Índice 2)
            const rawCod = linha[2]; 
            if (!rawCod) continue; // Pula linhas vazias

            const codFormatado = formatarCodItem(rawCod);

            mapExcel.set(codFormatado, {
                Cont04: limparNumero(linha[colMap.Cont04]),
                Cont08: limparNumero(linha[colMap.Cont08]),
                Cont12: limparNumero(linha[colMap.Cont12]),
                Cont16: limparNumero(linha[colMap.Cont16]),
                Cont26: limparNumero(linha[colMap.Cont26]),
                Cont52: limparNumero(linha[colMap.Cont52]),
                ContAno: limparNumero(linha[colMap.ContAno]),
                ContTt: limparNumero(linha[colMap.ContTotal]),
                
                TotalGeral: limparNumero(linha[colMap.TotalGeral]),
                Metodo: limparNumero(linha[colMap.Metodo]),
                MetEst: limparNumero(linha[colMap.MetEst]),
                
                Md04: limparNumero(linha[colMap.Md04]),
                Md08: limparNumero(linha[colMap.Md08]),
                Md12: limparNumero(linha[colMap.Md12]),
                Md16: limparNumero(linha[colMap.Md16]),
                Md26: limparNumero(linha[colMap.Md26]),
                Md52: limparNumero(linha[colMap.Md52]),
                MdAno: limparNumero(linha[colMap.MdAno]),
                MdTt: limparNumero(linha[colMap.MdTt]),
                
                Maximo: limparNumero(linha[colMap.Maximo]),
                
                TP_Metodo: linha[colMap.TP_Metodo] ? String(linha[colMap.TP_Metodo]).trim() : "",
                
                Estoque: limparNumero(linha[colMap.Estoque]),
                Reposicao: limparNumero(linha[colMap.Reposicao]),
                Giro: limparNumero(linha[colMap.Giro]),
                Fx_Giro: linha[colMap.Fx_Giro] ? String(linha[colMap.Fx_Giro]).trim() : ""
            });
        }
        
        console.log(`✅ Excel processado: ${mapExcel.size} itens mapeados.`);

        // 5. COMPARAR
        const divergencias = [];
        let totalAnalisados = 0;

        listaJson.forEach(itemWrapper => {
            const dados = itemWrapper.dados; 
            const id = itemWrapper.id;
            const cod = dados.cod_item;

            if (mapExcel.has(cod)) {
                totalAnalisados++;
                const xls = mapExcel.get(cod);
                
                const comparacoes = {
                    'Cont04': [Number(dados.contagens?.Cont04 || 0), xls.Cont04],
                    'Cont08': [Number(dados.contagens?.Cont08 || 0), xls.Cont08],
                    'Cont12': [Number(dados.contagens?.Cont12 || 0), xls.Cont12],
                    'Cont16': [Number(dados.contagens?.Cont16 || 0), xls.Cont16],
                    'Cont26': [Number(dados.contagens?.Cont26 || 0), xls.Cont26],
                    'Cont52': [Number(dados.contagens?.Cont52 || 0), xls.Cont52],
                    'ContAno': [Number(dados.contagens?.ContAno || 0), xls.ContAno],
                    'ContTt': [Number(dados.contagens?.ContTt || 0), xls.ContTt],
                    
                    'Total Geral': [Number(dados.total_geral || 0), xls.TotalGeral],
                    
                    'Md04': [Number(dados.medianas?.Md04 || 0), xls.Md04],
                    'Md08': [Number(dados.medianas?.Md08 || 0), xls.Md08],
                    'Md12': [Number(dados.medianas?.Md12 || 0), xls.Md12],
                    'Md16': [Number(dados.medianas?.Md16 || 0), xls.Md16],
                    'Md26': [Number(dados.medianas?.Md26 || 0), xls.Md26],
                    'Md52': [Number(dados.medianas?.Md52 || 0), xls.Md52],
                    'MdAno': [Number(dados.medianas?.MdAno || 0), xls.MdAno],
                    'MdTt': [Number(dados.medianas?.MdTt || 0), xls.MdTt],
                    
                    'Máximo': [Number(dados.maximo || 0), xls.Maximo],
                    'Metodo': [Number(dados.metodo || 0), xls.Metodo],
                    'MetEst': [Number(dados.met_est || 0), xls.MetEst],
                    
                    'Estoque': [Number(dados.estoque || 0), xls.Estoque],
                    'Reposição': [Number(dados.reposicao || 0), xls.Reposicao],
                    
                    'Giro': [Number(dados.giro || 0), xls.Giro],
                    
                    // Strings
                    'TP_Metodo': [String(dados.tp_metodo || ""), xls.TP_Metodo],
                    'Fx_Giro': [String(dados.fx_giro || ""), xls.Fx_Giro]
                };

                const camposDivergentes = [];
                for (const [campo, valores] of Object.entries(comparacoes)) {
                    const valJson = valores[0];
                    const valXls = valores[1];

                    if (typeof valJson === 'number') {
                        // Tolerância de 0.05 para arredondamentos
                        if (Math.abs(valJson - valXls) > 0.05) {
                            camposDivergentes.push(`   -> ${campo} | JSON: ${valJson} | XLS: ${valXls}`);
                        }
                    } else {
                        // Comparação de Strings (Case insensitive e trim)
                        if (valJson.trim().toUpperCase() !== valXls.trim().toUpperCase()) {
                            camposDivergentes.push(`   -> ${campo} | JSON: "${valJson}" | XLS: "${valXls}"`);
                        }
                    }
                }

                if (camposDivergentes.length > 0) {
                    divergencias.push({
                        id: id,
                        cod: cod,
                        nome: dados.nome, // Adicionei nome para facilitar leitura
                        detalhes: camposDivergentes.join('\n')
                    });
                }
            }
        });

        // 6. GERAR RELATÓRIO
        let conteudoArquivo = '=== RELATÓRIO DE DIVERGÊNCIAS (VIA EXCEL) ===\n';
        conteudoArquivo += `Data: ${new Date().toLocaleString()}\n`;
        conteudoArquivo += `Planilha Base: ${EXCEL_FILE} (Aba: ${TARGET_SHEET})\n`;
        conteudoArquivo += `Itens analisados: ${totalAnalisados}\n`;
        conteudoArquivo += `Itens com divergência: ${divergencias.length}\n`;
        conteudoArquivo += '=============================================\n\n';

        if (divergencias.length > 0) {
            divergencias.forEach((d, index) => {
                conteudoArquivo += `[${index + 1}] ID: ${d.id} | COD: ${d.cod}\n`;
                conteudoArquivo += `ITEM: ${d.nome}\n`;
                conteudoArquivo += `${d.detalhes}\n`;
                conteudoArquivo += '---------------------------------------------\n';
            });
            
            // Lista de IDs no final para facilitar cópia
            conteudoArquivo += '\n\n=== LISTA DE IDs PARA CORREÇÃO ===\n';
            conteudoArquivo += JSON.stringify(divergencias.map(d => d.id), null, 2);
            
        } else {
            conteudoArquivo += "✅ SUCESSO! Todos os cálculos batem com a planilha.";
        }

        fs.writeFileSync(path.join(__dirname, OUTPUT_FILE), conteudoArquivo, 'utf-8');
        console.log(`\nRelatório gerado com sucesso: ${OUTPUT_FILE}`);

    } catch (e) {
        console.error("\n❌ ERRO FATAL:", e.message);
    }
}

main();