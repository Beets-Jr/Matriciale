import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Box, Skeleton, useMediaQuery, useTheme } from '@mui/material';
import { PieChart } from '@mui/x-charts/PieChart';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import ColorLegend from '../../Gerenciamento/ColorLegend';

const StockChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // Mapeamento de labels do gráfico para classes de status
  const labelToStatusClass = {
    'ZERADOS INATIVOS': 'zerado-inativo',
    'ZERADOS COM DISPENSAÇÕES': 'zerado-dispensacao',
    'ATÉ UM MÊS DE ESTOQUE': 'quatro-semanas',
    'ATÉ DOIS MESES DE ESTOQUE': 'oito-semanas',
    'ATÉ TRÊS MESES DE ESTOQUE': 'doze-semanas',
    'ATÉ QUATRO MESES DE ESTOQUE': 'dezesseis-semanas',
    'ATÉ DOZE MESES DE ESTOQUE': 'azul-claro',
    'OUTROS COM MAIS DE DOZE MESES DE ESTOQUE': 'azul-escuro',
    'INATIVOS COM ESTOQUE': 'dezesseis-semanas-inativo'
  };

  // Função para limpar o prefixo (letra + ponto) do fx_giro
  const cleanFxGiro = (fxGiro) => {
    if (!fxGiro || typeof fxGiro !== 'string') return '';
    // Remove o padrão "X." do início (onde X é qualquer letra)
    return fxGiro.replace(/^[A-Z]\./, '').trim();
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user?.email) return;

        const response = await api.get('/medicines/general', {
          params: { email: user.email }
        });

        let medicines = [];
        if (Array.isArray(response.data)) {
          medicines = response.data;
        } else if (response.data && response.data.medicines) {
          medicines = response.data.medicines;
        }

        const statusCounts = {
          'ZERADOS INATIVOS': 0,
          'ZERADOS COM DISPENSAÇÕES': 0,
          'ATÉ UM MÊS DE ESTOQUE': 0,
          'ATÉ DOIS MESES DE ESTOQUE': 0,
          'ATÉ TRÊS MESES DE ESTOQUE': 0,
          'ATÉ QUATRO MESES DE ESTOQUE': 0,
          'ATÉ DOZE MESES DE ESTOQUE': 0,
          'OUTROS COM MAIS DE DOZE MESES DE ESTOQUE': 0,
          'INATIVOS COM ESTOQUE': 0
        };
        // Utiliza a classificação fx_giro que já vem do banco
        medicines.forEach(med => {
          const fxGiro = cleanFxGiro(med.fx_giro);
          
          // Incrementa o contador correspondente
          if (fxGiro && statusCounts.hasOwnProperty(fxGiro)) {
            statusCounts[fxGiro]++;
          }
        });

        // Cores correspondentes à ColorLegend
        const chartData = [
          { label: 'ZERADOS INATIVOS', value: statusCounts['ZERADOS INATIVOS'], color: '#CC99FF' },
          { label: 'ZERADOS COM DISPENSAÇÕES', value: statusCounts['ZERADOS COM DISPENSAÇÕES'], color: '#C00000' },
          { label: 'ATÉ UM MÊS DE ESTOQUE', value: statusCounts['ATÉ UM MÊS DE ESTOQUE'], color: '#FF0000' },
          { label: 'ATÉ DOIS MESES DE ESTOQUE', value: statusCounts['ATÉ DOIS MESES DE ESTOQUE'], color: '#FF9900' },
          { label: 'ATÉ TRÊS MESES DE ESTOQUE', value: statusCounts['ATÉ TRÊS MESES DE ESTOQUE'], color: '#00CC00' },
          { label: 'ATÉ QUATRO MESES DE ESTOQUE', value: statusCounts['ATÉ QUATRO MESES DE ESTOQUE'], color: '#008000' },
          { label: 'ATÉ DOZE MESES DE ESTOQUE', value: statusCounts['ATÉ DOZE MESES DE ESTOQUE'], color: '#0000FF' },
          { label: 'OUTROS COM MAIS DE DOZE MESES DE ESTOQUE', value: statusCounts['OUTROS COM MAIS DE DOZE MESES DE ESTOQUE'], color: '#000099' },
          { label: 'INATIVOS COM ESTOQUE', value: statusCounts['INATIVOS COM ESTOQUE'], color: '#6600CC' },
        ].filter(item => item.value > 0);

        setData(chartData);
      } catch (error) {
        console.error('Error fetching chart data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  return (
    <Card sx={{ 
      width: '100%',
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <CardContent sx={{ 
        p: { xs: 0.5, md: 1 }, 
        display: 'flex', 
        flexDirection: 'column', 
        flex: 1,
        overflow: 'hidden'
      }}>
        <Typography 
          variant="h5" 
          align="center" 
          sx={{ 
            fontWeight: 'bold', 
            mb: 0,
            fontSize: { xs: '1rem', md: '1.2rem' },
            color: '#0D91F3',
            flexShrink: 0,
            lineHeight: 1.1,
            py: 0.5
          }}
        >
          CAF - Giro de Estoque
        </Typography>

        {loading ? (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            flex: 1
          }}>
            <Skeleton 
              variant="circular" 
              width={isMobile ? 250 : 300} 
              height={isMobile ? 250 : 300} 
            />
          </Box>
        ) : (
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            flex: 1,
            overflow: 'hidden',
            gap: 0
          }}>
            {/* Gráfico */}
            <Box sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
              flex: '0 0 auto',
              maxHeight: '400px',
              mb: 0,
              pb: 0,
              mt: 0
            }}>
              <PieChart
                series={[
                  {
                    data: data.map((item, index) => ({ 
                      ...item, 
                      id: item.label || index
                    })),
                    outerRadius: isMobile ? 85 : isTablet ? 105 : 120,
                    paddingAngle: 2,
                    cornerRadius: 8,
                    highlightScope: { faded: 'global', highlighted: 'item' },
                    arcLabel: (item) => {
                      const total = data.reduce((a, b) => a + b.value, 0);
                      const percent = (item.value / total) * 100;
                      return percent > 5 ? `${item.value}` : '';
                    },
                    arcLabelMinAngle: 20,
                  },
                ]}
                onItemClick={(event, d) => {
                  if (d && d.dataIndex !== undefined && data[d.dataIndex]) {
                    const clickedItem = data[d.dataIndex];
                    const statusClass = labelToStatusClass[clickedItem.label];
                    if (statusClass) {
                      navigate(`/gerenciamento?colorFilter=${statusClass}`);
                    }
                  }
                }}
                width={isMobile ? 350 : isTablet ? 400 : 420}
                height={isMobile ? 350 : isTablet ? 380 : 380}
                margin={{ 
                  top: 0, 
                  bottom: 0, 
                  left: isMobile ? 10 : 15, 
                  right: isMobile ? 10 : 15
                }}
                slotProps={{
                  legend: { hidden: true }
                }}
                sx={{
                  '& .MuiPieArc-root': {
                    cursor: 'pointer',
                    transition: 'opacity 0.2s ease',
                    '&:hover': {
                      opacity: 0.8
                    }
                  }
                }}
              />
            </Box>

            {/* Legenda Customizada */}
            <Box sx={{ 
              width: '100%', 
              maxWidth: '900px',
              flex: '0 0 auto',
              overflow: 'visible',
              mt: 0,
              pt: 0
            }}>
              <ColorLegend />
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default StockChart;