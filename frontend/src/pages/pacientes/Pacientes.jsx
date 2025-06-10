import Header from "../../components/Header"
import Sidebar from "../../components/Sidebar"
import BuscarPacientes from "../../components/Pacientes/BuscarPacientes"
import styles from "../../styles/Pacientes.module.css"

export default function Pacientes(){
  return(
    <>
      <Header/>
      <div style={{
        display: "flex",
      }}>
        <Sidebar/>
        <BuscarPacientes/>
      </div>
    </>
  )
}