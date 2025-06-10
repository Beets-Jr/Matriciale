import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { PieChart } from '@mui/x-charts/PieChart';
import { useNavigate } from 'react-router-dom';

const mockData = [
  { value: 33.1, label: 'Setor 1', color: '#8D2ABB8A', filter: 'zerado' }, // Cor zerado
  { value: 24.8, label: 'Setor 2', color: '#C5262678', filter: 'quatro-semanas' }, // Cor 4 semanas
  { value: 20.2, label: 'Setor 3', color: '#F4660070', filter: 'oito-semanas' }, // Cor 8 semanas
  { value: 16.3, label: 'Setor 4', color: '#379A1352', filter: 'doze-semanas' }, // Cor 12 semanas
  { value: 12.4, label: 'Setor 6', color: '#005E0070', filter: 'dezesseis-semanas' }, // Cor 16 semanas
  { value: 5.6, label: 'Setor 5', color: '#136EF882', filter: 'mais-dezesseis-semanas' }, // Cor +16 semanas
].sort((a, b) => a.value - b.value); // Ordena do menor para o maior valor

const StockChart = () => {
  const navigate = useNavigate();

  const handleSectorClick = (event, itemIdentifier) => {
    if (itemIdentifier && itemIdentifier.dataIndex !== undefined) {
      const clickedSector = mockData[itemIdentifier.dataIndex];
      if (clickedSector && clickedSector.filter) {
        // Navega para a página de medicamentos com o filtro aplicado
        navigate(`/gerenciamento?filter=${clickedSector.filter}`);
      }
    }
  };

  return (
    <Card>
      <CardContent sx={{ p: 2.5 }}>
        <Typography variant="h6" gutterBottom>
          CAF - Giro de Estoque
        </Typography>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center',
          alignItems: 'center',
          height: '350px',
          width: '100%'
        }}>
          <PieChart
            series={[
              {
                data: mockData,
                outerRadius: 130,
                paddingAngle: 0.5,
                cornerRadius: 0,
                highlightScope: { faded: 'global', highlighted: 'item' },
                startAngle: -2, // Começa do topo (00h)
              },
            ]}
            width={400}
            height={320}
            onItemClick={handleSectorClick}
            slotProps={{
              legend: { hidden: true }
            }}
            sx={{
              cursor: 'pointer',
              '& .MuiChartsLegend-root': {
                display: 'none'
              },
              '& path': {
                cursor: 'pointer'
              }
            }}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default StockChart; 