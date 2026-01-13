import React from "react";
import styles from "../../styles/FilterRelatorio.module.css";

const FilterNomeItem = ({ showFilter, onNomeItemFilter }) => {
  if (!showFilter) return null; // Se showFilter for false, não renderiza nada

  return (
    <div>
      <ul>
        <li onClick={() => onNomeItemFilter("")} className={styles.primeiro_item}>
          Todos
        </li>
        <li onClick={() => onNomeItemFilter("AAS - Ácido Acetil Salicilico 100MG")}>
          AAS - Ácido Acetil Salicilico 100MG
        </li>
        <li onClick={() => onNomeItemFilter("Aciclovir 200 MG CPR")}>
          Aciclovir 200 MG CPR
        </li>
        <li onClick={() => onNomeItemFilter("Aciclovir Creme 5% 10G")}>
          Aciclovir Creme 5% 10G
        </li>
        <li onClick={() => onNomeItemFilter("Ácido Folico 5MG")}>
          Ácido Folico 5MG
        </li>
        <li onClick={() => onNomeItemFilter("Ácido Tranexâmico 250MG - Transamin")}>
          Ácido Tranexâmico 250MG - Transamin
        </li>
        <li onClick={() => onNomeItemFilter("Ácido Valproico 250MG")}>
          Ácido Valproico 250MG
        </li>
        <li onClick={() => onNomeItemFilter("Ácido Valproico 500MG")}>
          Ácido Valproico 500MG
        </li>
        <li onClick={() => onNomeItemFilter("Albendazol 40 MG/ML Frasco 10ML")}>
          Albendazol 40 MG/ML Frasco 10ML
        </li>
        <li onClick={() => onNomeItemFilter("Albendazol 400MG")}>
          Albendazol 400MG
        </li>
        <li onClick={() => onNomeItemFilter("Alopurinol 300MG")}>
          Alopurinol 300MG
        </li>
        <li onClick={() => onNomeItemFilter("Alopurinol 100MG")}>
          Alopurinol 100MG
        </li>
        <li onClick={() => onNomeItemFilter("Ambroxol Xarope Adulto")}>
          Ambroxol Xarope Adulto
        </li>
        <li onClick={() => onNomeItemFilter("Ambroxol Xarope Infantil")} className={styles.ultimo_item}>
          Ambroxol Xarope Infantil
        </li>
      </ul>
    </div>
  );
};

export default FilterNomeItem;
