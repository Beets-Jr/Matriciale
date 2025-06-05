import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import HistoryTableRow from './HistoryTableRow';
import Header from '../Header';
import Sidebar from '../Sidebar';
import styles from '../../styles/Pacientes.module.css'

const VisualizarPacientes = () => {
  const { id, nome } = useParams(); 
  const [history, setHistory] = useState([]);

  useEffect(() => {
    
    const mockHistory = {
      '1': [
        {
          unidade: 'Farmácia Dona Dominga',
          codigoItem: '302001001',
          medicamento: 'Bebetida, Divaldostate',
          classificacao: 'Assistencial',
          data: '12/10/2024',
          reposicao: '00123450503',
          quantidade: 30,
        },
        {
          unidade: 'Farmácia Central',
          codigoItem: '21001060',
          medicamento: 'Ivermectina',
          classificacao: 'Ordinários',
          data: '20/11/2024',
          reposicao: '00123450504',
          quantidade: 15,
        },
      ],
      '2': [
        {
          unidade: 'Farmácia Santa Clara',
          codigoItem: '40402010',
          medicamento: 'Paracetamol 500mg',
          classificacao: 'Controlados',
          data: '05/09/2024',
          reposicao: '00987654321',
          quantidade: 20,
        },
        {
          unidade: 'Farmácia Saúde Integral',
          codigoItem: '302001002',
          medicamento: 'Dipirona Sódica',
          classificacao: 'Assistencial',
          data: '15/10/2024',
          reposicao: '00123450505',
          quantidade: 10,
        },
        {
          unidade: 'Farmácia Saúde Integral',
          codigoItem: '302001002',
          medicamento: 'Dipirona Sódica',
          classificacao: 'Assistencial',
          data: '20/11/2024',
          reposicao: '00123450506',
          quantidade: 5,
        },
      ],
      
    };

    const historicoDoPaciente = mockHistory[id] || [];
    setHistory(historicoDoPaciente);
  }, [id]);

  return (
    <>
        <Header/>
        <div style={{
            display: 'flex'
        }}>
            <Sidebar/>
            <div 
                className= {styles.patientViewContainer}
                style={{
                    marginLeft: '22%'
                }}
            >
            <h2 className={styles.patientName}><span><img src='../../img/do-utilizador.png' alt="" /></span>{decodeURIComponent(nome)}</h2>
            <p className={styles.patientSubtitle}>Histórico de Medicamentos</p>

            <table className={styles.historyTable}
              style={{
                borderSpacing: "0px 11.62px",
                width: "100%",
                overflowY: "auto",
              }}
            >
                <thead>
                <tr style={{
                  position: "sticky",
                  backgroundColor: "#F3F1EE",
                }}> 
                    <th>Unidade</th>
                    <th>Código Item</th>
                    <th>Medicamento</th>
                    <th>Classificação</th>
                    <th>Data</th>
                    <th>Reposição</th>
                    <th>Quantidade</th>
                </tr>
                </thead>
                <tbody>
                {history.length > 0 ? (
                    history.map((item, index) => (
                    <HistoryTableRow key={index} historyItem={item} />
                    ))
                ) : (
                    <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '1rem' }}>
                        Nenhum histórico encontrado.
                    </td>
                    </tr>
                )}
                </tbody>
            </table>
            </div>
        </div>
    </>
  );
};

export default VisualizarPacientes;