import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  TextField,
  Select,
  MenuItem,
  InputAdornment,
  Button
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';

const mockPacientes = [
  {
    id: 1,
    nome: 'Roberto Gomez',
    sus: 'XXX XXXX XXXX XXXX',
  },
  {
    id: 2,
    nome: 'Ramon Valdez',
    sus: 'XXX XXXX XXXX XXXX',
  },
  {
    id: 3,
    nome: 'Maria Antonia Nevez',
    sus: 'XXX XXXX XXXX XXXX',
  },
  {
    id: 4,
    nome: 'Edgar Araujo',
    sus: 'XXX XXXX XXXX XXXX',
  },
  {
    id: 5,
    nome: 'Ana Paula Souza',
    sus: 'XXX XXXX XXXX XXXX',
  },
];

const HEADER_HEIGHT = 64;
const SIDEBAR_WIDTH = 240;

export default function Pacientes() {
  const [busca, setBusca] = useState('');
  const [mecanismo, setMecanismo] = useState('');

  const pacientesFiltrados = mockPacientes.filter(p =>
    p.nome.toLowerCase().includes(busca.toLowerCase()) ||
    p.sus.replace(/ /g, '').includes(busca.replace(/ /g, ''))
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f5f6fa', fontFamily: 'LT Wave, sans-serif' }}>
      {/* Header fixa */}
      <Box sx={{ position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 1200 }}>
        <Header />
      </Box>
      <Box sx={{ display: 'flex', flex: 1, pt: `${HEADER_HEIGHT}px` }}>
        <Box sx={{ position: 'fixed', top: `${HEADER_HEIGHT}px`, left: 0, height: `calc(100vh - ${HEADER_HEIGHT}px)`, zIndex: 1100 }}>
          <Sidebar />
        </Box>
        {/* Conteúdo principal */}
        <Box
          sx={{
            flex: 1,
            ml: `${SIDEBAR_WIDTH}px`,
            p: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            minHeight: `calc(100vh - ${HEADER_HEIGHT}px)`
          }}
        >
          <Paper
            elevation={3}
            sx={{
              borderRadius: 4,
              p: 4,
              bgcolor: '#f5f6fa',
              width: '100%',
              maxWidth: 1100,
              mt: 6,
              mb: 4,
              mx: 3
            }}
          >
            <Typography variant="h4" fontWeight={700} mb={3} sx={{ fontSize: '2rem', fontFamily: 'LT Wave, sans-serif' }}>
              Buscar Paciente
            </Typography>
            <Box display="flex" gap={2} mb={3}>
              <TextField
                sx={{ width: '50%', fontFamily: 'LT Wave, sans-serif' }}
                variant="outlined"
                placeholder="Digite o nome ou CPF do paciente"
                value={busca}
                onChange={e => setBusca(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="disabled" />
                    </InputAdornment>
                  ),
                  sx: { bgcolor: '#d1d5db', borderRadius: 5 }
                }}
              />
              <Select
                displayEmpty
                value={mecanismo}
                onChange={e => setMecanismo(e.target.value)}
                sx={{ minWidth: 320, bgcolor: '#fff', borderRadius: 5, fontFamily: 'LT Wave, sans-serif' }}
              >
                <MenuItem value="">
                  <em>Selecione o Mecanismo de Busca</em>
                </MenuItem>
                <MenuItem value="nome">Nome</MenuItem>
                <MenuItem value="cpf">CPF</MenuItem>
                <MenuItem value="sus">Cartão SUS</MenuItem>
              </Select>
            </Box>
            <Box display="flex" flexDirection="column" gap={2}>
              {pacientesFiltrados.map((p, idx) => (
                <Box
                  key={p.id}
                  display="flex"
                  alignItems="center"
                  sx={{
                    bgcolor: '#e9e6f7',
                    borderRadius: 2,
                    px: 3,
                    py: 1,
                    boxShadow: 0,
                    transition: 'background 0.2s',
                  }}
                >
                  <Box width={48} display="flex" justifyContent="center">
                    <PersonOutlineIcon fontSize="large" sx={{ color: '#5c5470' }} />
                  </Box>
                  <Box display="flex" alignItems="center" flex={2} minWidth={140}>
                    <Typography fontWeight={700} sx={{ fontSize: '1.3rem', minWidth: 140, fontFamily: 'LT Wave, sans-serif' }}>
                      Nome:
                    </Typography>
                    <Typography sx={{ fontSize: '1rem', ml: 1, mr: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180, fontFamily: 'LT Wave, sans-serif' }}>
                      {p.nome}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" flex={2} minWidth={170}>
                    <Typography fontWeight={700} sx={{ fontSize: '1.3rem', minWidth: 170, fontFamily: 'LT Wave, sans-serif' }}>
                      Cartão do SUS:
                    </Typography>
                    <Typography sx={{ fontSize: '1rem', ml: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180, fontFamily: 'LT Wave, sans-serif' }}>
                      {p.sus}
                    </Typography>
                  </Box>
                  <Box flex={1} minWidth={120} display="flex" justifyContent="flex-end">
                    <Button
                      variant="contained"
                      sx={{
                        bgcolor: '#3f51b5',
                        color: '#fff',
                        borderRadius: 5,
                        px: 6,
                        py: 1.5,
                        fontWeight: 700,
                        fontSize: '1.1rem',
                        fontFamily: 'LT Wave, sans-serif',
                        boxShadow: 0,
                        '&:hover': { bgcolor: '#283593' }
                      }}
                    >
                      Visualizar
                    </Button>
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
} 