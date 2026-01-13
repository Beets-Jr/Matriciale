import React from 'react';


const HistoryTableRow = ({ historyItem }) => {
  return (
    <tr className="table-row">
      <td className="coluna-unidade">{historyItem.unidade}</td>
      <td className="coluna-codigoItem">{historyItem.codigoItem}</td>
      <td className="coluna-medicamento">{historyItem.medicamento}</td>
      <td className="coluna-classificacao">{historyItem.classificacao}</td>
      <td className="coluna-data">{historyItem.data}</td>
      <td className="coluna-reposicao">{historyItem.reposicao}</td>
      <td className="coluna-quantidade">{historyItem.quantidade}</td>
    </tr>
  );
};

export default HistoryTableRow;