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
      '3': [
        {
          unidade: 'Farmácia Popular',
          codigoItem: '50102030',
          medicamento: 'Amoxicilina 500mg',
          classificacao: 'Assistencial',
          data: '10/08/2024',
          reposicao: '00234567890',
          quantidade: 21,
        },
        {
          unidade: 'Farmácia Regional Norte',
          codigoItem: '21002060',
          medicamento: 'Losartana Potássica',
          classificacao: 'Ordinários',
          data: '12/10/2024',
          reposicao: '00234567891',
          quantidade: 28,
        },
      ],
      '4': [
        {
          unidade: 'Farmácia Municipal Oeste',
          codigoItem: '30506001',
          medicamento: 'Metformina 850mg',
          classificacao: 'Assistencial',
          data: '25/08/2024',
          reposicao: '00345678900',
          quantidade: 60,
        },
        {
          unidade: 'Farmácia Santa Clara',
          codigoItem: '10101010',
          medicamento: 'Omeprazol 20mg',
          classificacao: 'Ordinários',
          data: '03/10/2024',
          reposicao: '00345678901',
          quantidade: 40,
        },
      ],
      '5': [
        {
          unidade: 'Farmácia Central',
          codigoItem: '90909090',
          medicamento: 'Cloroquina 150mg',
          classificacao: 'Controlados',
          data: '15/07/2024',
          reposicao: '00456789012',
          quantidade: 12,
        },
        {
          unidade: 'Farmácia Dona Dominga',
          codigoItem: '80808080',
          medicamento: 'Ibuprofeno 600mg',
          classificacao: 'Assistencial',
          data: '01/09/2024',
          reposicao: '00456789013',
          quantidade: 18,
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