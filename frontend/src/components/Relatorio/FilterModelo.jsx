import React from "react";
import styles from "../../styles/FilterRelatorio.module.css"

const FilterModelo = ({ showFilter, onModeloFilter }) => {
    if (!showFilter) return null; // Se showFilter for false, não renderiza nada

    return (
        <div>
            <ul>
                <li onClick={() => onModeloFilter("")} className={styles.primeiro_item}>Todos</li>
                <li onClick={() => onModeloFilter("1.Ordinários")}>1.Ordinários</li>
                <li onClick={() => onModeloFilter("2.Intermitentes")} className={styles.ultimo_item}>2.Intermitentes</li>
            </ul>
        </div>
    );
};

export default FilterModelo;
