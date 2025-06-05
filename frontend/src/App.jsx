import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { AuthProvider } from './contexts/AuthContext';
import { TaskProvider } from './components/Tela_Principal/Dashboard/TaskContext';
import theme from './theme';
import Routes from './routes';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <TaskProvider> {/* ⬅️ Envolva o componente com o TaskProvider */}
            <Routes />
          </TaskProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
