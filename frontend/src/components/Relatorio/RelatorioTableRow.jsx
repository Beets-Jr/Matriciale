import React from "react";
import styles from "../../styles/RelatorioTableRow.module.css"

const RelatorioTableRow = ({relatorios}) =>{
    return(
        <tr className={styles.row}>
            <td><div className={styles.item}>{relatorios.classificacao}</div></td>
            <td><div className={styles.item}>{relatorios.codItem}</div></td>
            <td><div className={styles.item}>{relatorios.nome}</div></td>
            <td><div className={styles.item}>{relatorios.tpMetodo}</div></td>
            <td><div className={styles.item}>{relatorios.metodo.toLocaleString('pt-BR')}</div></td>
            <td><div className={styles.item}>{relatorios.metEst.toLocaleString('pt-BR')}</div></td>
            <td><div className={styles.item}>{relatorios.estoque.toLocaleString('pt-BR')}</div></td>
            <td><div className={styles.item}>{relatorios.reposicao.toLocaleString('pt-BR')}</div></td>
        </tr>
    )
}

export default RelatorioTableRow;