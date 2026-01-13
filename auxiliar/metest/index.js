const fs = require('fs');
const path = require('path');

// Configuração dos arquivos
const TXT_FILE = 'a.txt';
const JSON_FILE = 'lista_CAF.json';
const OUTPUT_FILE = 'relatorio_divergencias.txt';

// Função auxiliar para limpar números
function limparNumero(str) {
    if (!str || str === 'NaN') return 0;
    // Remove pontos de milhar e ajusta vírgula decimal
    let limpo = str.replace(/\./g, '').replace(',', '.');
    let num = parseFloat(limpo);
    return isNaN(num) ? 0 : num;
}

function main() {
    try {
        console.log("Iniciando comparação detalhada... Aguarde.");

        // 1. Ler Arquivos
        const rawJson = fs.readFileSync(path.join(__dirname, JSON_FILE), 'utf-8');
        const listaJson = JSON.parse(rawJson);
        const rawTxt = fs.readFileSync(path.join(__dirname, TXT_FILE), 'utf-8');
        
        // 2. Mapear TXT
        const mapTxt = new Map();
        const linhas = rawTxt.split('\n');
        
        linhas.forEach((linha) => {
            const linhaLimpa = linha.trim();
            // Pula cabeçalho ou linhas vazias
            if (!linhaLimpa || linhaLimpa.startsWith('COD_ITEM')) return;

            // Divide por múltiplos espaços ou abas
            const cols = linhaLimpa.split(/\s+/);
            
            // Mapeamento baseado na ordem fornecida (Índices 0 a 25)
            if (cols.length >= 25) {
                const cod = cols[0].trim();
                mapTxt.set(cod, {
                    Cont04: limparNumero(cols[1]),
                    Cont08: limparNumero(cols[2]),
                    Cont12: limparNumero(cols[3]),
                    Cont16: limparNumero(cols[4]),
                    Cont26: limparNumero(cols[5]),
                    Cont52: limparNumero(cols[6]),
                    ContAno: limparNumero(cols[7]),
                    ContTt: limparNumero(cols[8]),
                    TotalGeral: limparNumero(cols[9]),
                    Metodo: limparNumero(cols[10]),
                    MetEst: limparNumero(cols[11]),
                    Md04: limparNumero(cols[12]),
                    Md08: limparNumero(cols[13]),
                    Md12: limparNumero(cols[14]),
                    Md16: limparNumero(cols[15]),
                    Md26: limparNumero(cols[16]),
                    Md52: limparNumero(cols[17]),
                    MdAno: limparNumero(cols[18]),
                    MdTt: limparNumero(cols[19]),
                    Maximo: limparNumero(cols[20]),
                    TP_Metodo: cols[21] ? cols[21].trim() : "",
                    // colunas 22 e 23 são repetições de Metodo/MetEst no TXT
                    Estoque: limparNumero(cols[24]),
                    Reposicao: limparNumero(cols[25])
                });
            }
        });

        // 3. Comparar
        const divergencias = [];
        let totalAnalisados = 0;

        listaJson.forEach(itemWrapper => {
            const dados = itemWrapper.dados; 
            const id = itemWrapper.id;
            const cod = dados.cod_item;

            if (mapTxt.has(cod)) {
                totalAnalisados++;
                const txt = mapTxt.get(cod);
                
                // Mapeamento De -> Para (JSON -> TXT)
                const comparacoes = {
                    'Cont04': [Number(dados.contagens?.Cont04 || 0), txt.Cont04],
                    'Cont08': [Number(dados.contagens?.Cont08 || 0), txt.Cont08],
                    'Cont12': [Number(dados.contagens?.Cont12 || 0), txt.Cont12],
                    'Cont16': [Number(dados.contagens?.Cont16 || 0), txt.Cont16],
                    'Cont26': [Number(dados.contagens?.Cont26 || 0), txt.Cont26],
                    'Cont52': [Number(dados.contagens?.Cont52 || 0), txt.Cont52],
                    'ContAno': [Number(dados.contagens?.ContAno || 0), txt.ContAno],
                    'ContTt': [Number(dados.contagens?.ContTt || 0), txt.ContTt],
                    'Total Geral': [Number(dados.total_geral || 0), txt.TotalGeral],
                    'Md04': [Number(dados.medianas?.Md04 || 0), txt.Md04],
                    'Md08': [Number(dados.medianas?.Md08 || 0), txt.Md08],
                    'Md12': [Number(dados.medianas?.Md12 || 0), txt.Md12],
                    'Md16': [Number(dados.medianas?.Md16 || 0), txt.Md16],
                    'Md26': [Number(dados.medianas?.Md26 || 0), txt.Md26],
                    'Md52': [Number(dados.medianas?.Md52 || 0), txt.Md52],
                    'MdAno': [Number(dados.medianas?.MdAno || 0), txt.MdAno],
                    'MdTt': [Number(dados.medianas?.MdTt || 0), txt.MdTt],
                    'Máximo': [Number(dados.maximo || 0), txt.Maximo],
                    'Metodo': [Number(dados.metodo || 0), txt.Metodo],
                    'MetEst': [Number(dados.met_est || 0), txt.MetEst],
                    'Estoque': [Number(dados.estoque || 0), txt.Estoque],
                    'Reposição': [Number(dados.reposicao || 0), txt.Reposicao],
                    'TP_Metodo': [String(dados.tp_metodo || ""), txt.TP_Metodo]
                };

                const camposDivergentes = [];
                for (const [campo, valores] of Object.entries(comparacoes)) {
                    const valJson = valores[0];
                    const valTxt = valores[1];

                    if (typeof valJson === 'number') {
                        // Comparação numérica com margem de erro para decimais
                        if (Math.abs(valJson - valTxt) > 0.01) {
                            camposDivergentes.push(`   -> ${campo} | JSON: ${valJson} | TXT: ${valTxt}`);
                        }
                    } else {
                        // Comparação de string (TP_Metodo)
                        if (valJson !== valTxt) {
                            camposDivergentes.push(`   -> ${campo} | JSON: "${valJson}" | TXT: "${valTxt}"`);
                        }
                    }
                }

                if (camposDivergentes.length > 0) {
                    divergencias.push({
                        id: id,
                        cod: cod,
                        detalhes: camposDivergentes.join('\n')
                    });
                }
            }
        });

        // 4. Gerar Relatório
        let conteudoArquivo = '=== RELATÓRIO DE DIVERGÊNCIAS ATUALIZADO ===\n';
        conteudoArquivo += `Data: ${new Date().toLocaleString()}\n`;
        conteudoArquivo += `Itens analisados: ${totalAnalisados}\n`;
        conteudoArquivo += `Itens com divergência: ${divergencias.length}\n`;
        conteudoArquivo += '===========================================\n\n';

        if (divergencias.length > 0) {
            divergencias.forEach((d, index) => {
                conteudoArquivo += `[${index + 1}] ID: ${d.id} | COD: ${d.cod}\n`;
                conteudoArquivo += `${d.detalhes}\n`;
                conteudoArquivo += '-------------------------------------------\n';
            });
        } else {
            conteudoArquivo += "✅ Sucesso! Nenhuma divergência encontrada nos campos analisados.";
        }

        fs.writeFileSync(path.join(__dirname, OUTPUT_FILE), conteudoArquivo, 'utf-8');
        console.log(`Relatório gerado com sucesso: ${OUTPUT_FILE}`);

    } catch (e) {
        console.error("Erro fatal durante o processamento:", e.message);
    }
}

main();