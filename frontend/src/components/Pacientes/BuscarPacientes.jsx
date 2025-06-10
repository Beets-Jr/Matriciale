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
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';

const mockPacientes = [
  {
    id: 1,
    nome: 'Roberto Gomez',
    itens: 3,
    unidades: 45,
  },
  {
    id: 2,
    nome: 'Ramon Valdez',
    itens: 2,
    unidades: 35,
  },
  {
    id: 3,
    nome: 'Maria Antonia Nevez',
    itens: 2,
    unidades: 49,
  },
  {
    id: 4,
    nome: 'Edgar Araujo',
    itens: 2,
    unidades: 100,
  },
  {
    id: 5,
    nome: 'Ana Paula Souza',
    itens: 2,
    unidades: 30,
  },
];

const HEADER_HEIGHT = 64;
const SIDEBAR_WIDTH = 240;

export default function Pacientes() {
  const [busca, setBusca] = useState('');
  const [mecanismo, setMecanismo] = useState('nome');
  const navigate = useNavigate();

  const pacientesFiltrados = mockPacientes.filter(p => {
    return p.nome.toLowerCase().includes(busca.toLowerCase());
  });
  
  return (
    <Box
        sx={{
        flex: 1,
        marginLeft: '20%',
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
            bgcolor: '#F3F1EE',
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
            placeholder="Digite o nome do paciente"
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
            value={mecanismo}
            onChange={e => setMecanismo(e.target.value)}
            sx={{ minWidth: 320, bgcolor: '#fff', borderRadius: 5, fontFamily: 'LT Wave, sans-serif' }}
            >
            <MenuItem value="nome">Nome</MenuItem>
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
                <Box display="flex" alignItems="center" flex={3} minWidth={200}>
                <Typography fontWeight={700} sx={{ fontSize: '1.3rem', minWidth: 80, fontFamily: 'LT Wave, sans-serif' }}>
                    Nome:
                </Typography>
                <Typography sx={{ fontSize: '1rem', ml: 1, mr: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 220, fontFamily: 'LT Wave, sans-serif' }}>
                    {p.nome}
                </Typography>
                </Box>
                <Box display="flex" alignItems="center" flex={1.5} minWidth={120}>
                <Typography fontWeight={700} sx={{ fontSize: '1.3rem', minWidth: 60, fontFamily: 'LT Wave, sans-serif' }}>
                    Qtd itens:
                </Typography>
                <Typography sx={{ fontSize: '1rem', ml: 1, fontFamily: 'LT Wave, sans-serif' }}>
                    {p.itens}
                </Typography>
                </Box>
                <Box display="flex" alignItems="center" flex={1.5} minWidth={140} justifyContent="center">
                <Typography fontWeight={700} sx={{ fontSize: '1.3rem', minWidth: 80, fontFamily: 'LT Wave, sans-serif' }}>
                    Unidades:
                </Typography>
                <Typography sx={{ fontSize: '1rem', ml: 1, fontFamily: 'LT Wave, sans-serif' }}>
                    {p.unidades}
                </Typography>
                </Box>
                <Box flex={1} minWidth={120} display="flex" justifyContent="flex-end">
                <Button
                    variant="contained"
                    sx={{
                    bgcolor: 'var(--Azul2, #0D92F4)',
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
                    onClick={() => {
                        navigate(`/users/pacientes/${p.id}/${encodeURIComponent(p.nome)}`);                        
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
  );
} 