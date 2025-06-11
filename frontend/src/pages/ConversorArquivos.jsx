import React from 'react';
import FileConverter from '../components/FileConverter/FileConverter';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';

const ConversorArquivos = () => {
  return (
    <div>
      <Header />
      <div style={{
        display: "flex",
      }}>
        <Sidebar />
        <FileConverter />
      </div>
    </div>
  );
};

export default ConversorArquivos; 