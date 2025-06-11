import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import moment from 'moment';
import './FileConverter.css';

const FileConverter = () => {
  const [jsonOutput, setJsonOutput] = useState('');
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const parseExcelDate = (excelDate) => {
    const date = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleXLSXFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const workbook = XLSX.read(e.target.result, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          const data = XLSX.utils.sheet_to_json(worksheet, {
            raw: false,
            cellDates: true,
            defval: '',
            cellTransform: (cell, header) => {
              if (header === 'F') {
                if (cell instanceof Date) {
                  const day = String(cell.getDate()).padStart(2, '0');
                  const month = String(cell.getMonth() + 1).padStart(2, '0');
                  const year = cell.getFullYear();
                  return `${day}/${month}/${year}`;
                }
                
                if (typeof cell === 'number') {
                  const date = new Date(Math.round((cell - 25569) * 86400 * 1000));
                  const day = String(date.getDate()).padStart(2, '0');
                  const month = String(date.getMonth() + 1).padStart(2, '0');
                  const year = date.getFullYear();
                  return `${day}/${month}/${year}`;
                }
                
                if (typeof cell === 'string') {
                  const parsedDate = moment(cell, ['DD/MM/YYYY']);
                  if (parsedDate.isValid()) {
                    return parsedDate.format('DD/MM/YYYY');
                  }
                }
                
                return cell;
              }

              if (header === 'COD_ITEM') {
                return cell !== null && cell !== undefined 
                  ? String(Math.floor(Number(cell))) 
                  : '';
              }

              return cell;
            }
          });

          resolve(data);
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsBinaryString(file);
    });
  };

  const handleCSVFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const csvData = e.target.result;
          const results = Papa.parse(csvData, {
            header: true,
            dynamicTyping: false,
            transformHeader: (header) => header.trim(),
            transform: (value, header) => {
              if (header === 'F') {
                const parsedDate = moment(value, ['DD/MM/YYYY']);
                if (parsedDate.isValid()) {
                  return parsedDate.format('DD/MM/YYYY');
                }
                return value;
              }

              if (header === 'COD_ITEM') {
                const numValue = Number(value);
                return !isNaN(numValue) 
                  ? String(Math.floor(numValue)) 
                  : (value || '');
              }

              return value;
            }
          });

          resolve(results.data);
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsText(file);
    });
  };

  const handleFile = async (file) => {
    const fileExtension = file.name.split('.').pop().toLowerCase();

    let processingPromise;
    if (fileExtension === 'xlsx') {
      processingPromise = handleXLSXFile(file);
    } else if (fileExtension === 'csv') {
      processingPromise = handleCSVFile(file);
    } else {
      setJsonOutput('Formato de arquivo não suportado');
      return;
    }

    try {
      const convertedData = await processingPromise;
      
      if (!convertedData || convertedData.length === 0) {
        throw new Error('Nenhum dado encontrado no arquivo');
      }

      const displayData = convertedData.slice(0, 100);
      
      setJsonOutput(JSON.stringify({
        totalRecords: convertedData.length,
        previewRecords: displayData
      }, null, 2));

      console.log('Dados convertidos:', convertedData);
    } catch (error) {
      console.error('Erro completo:', error);
      setJsonOutput(`Erro: ${error.message}`);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragActive(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFile(file);
    }
  };

  return (
    <div className="file-converter-container">
      <h1>Drag and Drop File Converter</h1>
      <div 
        className={`drop-zone ${isDragActive ? 'active' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <p>Arraste e solte seu arquivo aqui (.csv, .xlsx)</p>
        <button 
          className="browse-btn"
          onClick={handleBrowseClick}
        >
          Escolher Arquivo
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx"
          style={{ display: 'none' }}
          onChange={handleFileInputChange}
        />
      </div>
      <div className="output-container">
        <h2>Resultado (JSON):</h2>
        <pre className="json-output">{jsonOutput}</pre>
      </div>
    </div>
  );
};

export default FileConverter; 