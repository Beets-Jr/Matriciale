import React from 'react';
import FileConverter from '../components/FileConverter/FileConverter';

const ConversorArquivos = () => {
  return (
    <div style={{ 
      backgroundColor: '#f4f4f4', 
      minHeight: '100vh', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      padding: '20px'
    }}>
      <FileConverter />
    </div>
  );
};

export default ConversorArquivos; 