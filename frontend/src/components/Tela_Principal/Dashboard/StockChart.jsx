import { Card, CardContent, Typography, Box } from '@mui/material';
import { PieChart } from '@mui/x-charts/PieChart';

const mockData = [
  { value: 33.1, label: 'Setor 1', color: '#1565C0' },
  { value: 24.8, label: 'Setor 2', color: '#4CAF50' },
  { value: 20.2, label: 'Setor 3', color: '#FF9800' },
  { value: 16.3, label: 'Setor 4', color: '#F44336' },
  { value: 12.4, label: 'Setor 6', color: '#81C784' },
  { value: 5.6, label: 'Setor 5', color: '#9C27B0' },
].sort((a, b) => a.value - b.value); // Ordena do menor para o maior valor

const StockChart = () => {
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
            slotProps={{
              legend: { hidden: true }
            }}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default StockChart; 