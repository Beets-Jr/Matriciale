import React from "react";
import styles from "../../styles/FilterRelatorio.module.css"

const FilterCodItem = ({ showFilter, onCodItemFilter }) => {
    if (!showFilter) return null; // Se showFilter for false, não renderiza nada

    return (
        <div>
            <ul>
                <li onClick={() => onCodItemFilter("")} className={styles.primeiro_item}>Todos</li>
                <li onClick={() => onCodItemFilter("021.001.092")}>021.001.092</li>
                <li onClick={() => onCodItemFilter("301.002.001")}>301.002.001</li>
                <li onClick={() => onCodItemFilter("301.002.002")}>301.002.002</li>
                <li onClick={() => onCodItemFilter("304.002.001")}>304.002.001</li>
                <li onClick={() => onCodItemFilter("304.004.001")}>304.004.001</li>
                <li onClick={() => onCodItemFilter("302.001.001")}>302.001.001</li>
                <li onClick={() => onCodItemFilter("013.001.003")}>013.001.003</li>
                <li onClick={() => onCodItemFilter("203.001.001")}>203.001.001</li>
                <li onClick={() => onCodItemFilter("301.003.001")}>301.003.001</li>
                <li onClick={() => onCodItemFilter("309.002.001")}>309.002.001</li>
                <li onClick={() => onCodItemFilter("309.002.022")}>309.002.022</li>
                <li onClick={() => onCodItemFilter("305.001.004")}>305.001.004</li>
                <li onClick={() => onCodItemFilter("305.001.005")} className={styles.ultimo_item}>305.001.005</li>
            </ul>
        </div>
    );
};

export default FilterCodItem;