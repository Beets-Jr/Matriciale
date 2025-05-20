import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  useTheme,
  useMediaQuery
} from '@mui/material';
import Header from '../../Header';
import Sidebar from '../../Sidebar';

// Tipos de eventos e suas cores
const EVENT_TYPES = {
  TAREFA: { label: 'Tarefa', color: '#FF9800' },
  REPOSICAO: { label: 'Reposição', color: '#9C27B0' },
  REUNIAO: { label: 'Reunião', color: '#4CAF50' },
  ENTREGA: { label: 'Entrega', color: '#F44336' }
};

// Função para gerar eventos mockados para o mês atual
const generateMockEvents = (year, month) => {
  const events = {};
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  // Gera eventos aleatórios para o mês
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();
    
    // Não gera eventos para finais de semana
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;
    
    // 30% de chance de ter um evento no dia
    if (Math.random() < 0.3) {
      const eventTypes = Object.values(EVENT_TYPES);
      const numEvents = Math.floor(Math.random() * 2) + 1; // 1 ou 2 eventos por dia
      
      events[`${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`] = 
        Array.from({ length: numEvents }, (_, i) => {
          const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
          return {
            id: `${day}-${i}`,
            title: eventType.label,
            color: eventType.color
          };
        });
    }
  }
  
  return events;
};

const Calendar = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Usar a data atual
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState([]);
  const [mockEvents, setMockEvents] = useState({});

  // Nomes dos dias da semana
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  
  // Nomes dos meses em português
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // Gerar eventos mockados quando o mês mudar
  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    setMockEvents(generateMockEvents(year, month));
  }, [currentDate]);

  // Função para gerar os dias do calendário
  useEffect(() => {
    const generateCalendarDays = () => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const firstDayOfWeek = firstDay.getDay();
      const daysInMonth = lastDay.getDate();
      
      const days = [];
      
      // Adicionar dias do mês anterior
      const prevMonthLastDay = new Date(year, month, 0).getDate();
      for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        const day = prevMonthLastDay - i;
        const date = new Date(year, month - 1, day);
        days.push({
          date,
          day,
          isCurrentMonth: false,
          isPrevMonth: true,
          formattedDate: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        });
      }
      
      // Adicionar dias do mês atual
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        days.push({
          date,
          day,
          isCurrentMonth: true,
          formattedDate: `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        });
      }
      
      // Adicionar dias do próximo mês
      const remainingDays = 42 - days.length;
      for (let day = 1; day <= remainingDays; day++) {
        const date = new Date(year, month + 1, day);
        days.push({
          date,
          day,
          isCurrentMonth: false,
          isNextMonth: true,
          formattedDate: `${year}-${String(month + 2).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        });
      }
      
      return days.reduce((weeks, day, i) => {
        if (i % 7 === 0) weeks.push([]);
        weeks[weeks.length - 1].push(day);
        return weeks;
      }, []);
    };
    
    setCalendarDays(generateCalendarDays());
  }, [currentDate]);

  // Renderiza os eventos para um determinado dia
  const renderEvents = (formattedDate) => {
    const events = mockEvents[formattedDate] || [];
    
    return events.map((event, index) => (
      <Box 
        key={event.id}
        sx={{ 
          display: 'flex',
          alignItems: 'center',
          mb: 0.5,
          fontSize: '0.75rem',
          bgcolor: '#f5f5f5',
          borderRadius: '4px',
          px: 1,
          py: 0.5,
          borderLeft: `10px solid ${event.color}`,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}
      >
        <Typography variant="caption" sx={{ fontSize: '0.75rem', ml: 1 }}>
          {event.title}
        </Typography>
      </Box>
    ));
  };

  // Obter o nome do mês e ano atual
  const monthYearString = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

  return (
    <>
      <Header/>
      <div style={{ display: "flex" }}>
        <Sidebar/>
        <Box
          sx={{
            p: { xs: 1, sm: 2, md: 3 },
            height: '100%',
            width: '100%',
            overflow: 'auto',
          }}
        >
          <Paper 
            elevation={1}
            sx={{ 
              p: { xs: 1, sm: 2 },
              borderRadius: 4,
              overflow: 'hidden',
              border: '1px solid #e0e0e0'
            }}
          >
            <Typography 
              variant="h5" 
              color="primary" 
              sx={{ 
                mb: 2, 
                fontWeight: 500,
                fontSize: { xs: '1.2rem', sm: '1.5rem' }
              }}
            >
              {monthYearString}
            </Typography>
            
            <TableContainer>
              <Table sx={{ tableLayout: 'fixed' }}>
                <TableHead>
                  <TableRow>
                    {weekDays.map((day, index) => (
                      <TableCell 
                        key={index} 
                        align="center"
                        sx={{ 
                          color: index === 0 || index === 6 ? 'error.main' : 'primary.main',
                          fontWeight: 'bold',
                          borderBottom: '2px solid',
                          borderColor: 'primary.main',
                          px: { xs: 0.5, sm: 1 },
                          py: 1,
                          fontSize: { xs: '0.8rem', sm: '0.9rem' }
                        }}
                      >
                        {day}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {calendarDays.map((week, weekIndex) => (
                    <TableRow key={weekIndex}>
                      {week.map((day, dayIndex) => (
                        <TableCell 
                          key={dayIndex}
                          align="center"
                          sx={{ 
                            height: { xs: 80, sm: 100 },
                            width: `${100/7}%`,
                            p: { xs: 0.5, sm: 1 },
                            verticalAlign: 'top',
                            border: '1px solid #e0e0e0',
                            backgroundColor: day.isCurrentMonth 
                              ? 'inherit' 
                              : 'rgba(0, 0, 255, 0.1)',
                          }}
                        >
                          <Typography 
                            sx={{ 
                              fontWeight: 'medium',
                              color: !day.isCurrentMonth 
                                ? 'text.secondary' 
                                : 'inherit',
                              fontSize: { xs: '0.8rem', sm: '0.9rem' },
                              mb: 1
                            }}
                          >
                            {day.isNextMonth && day.day === 1 ? '1 mar' : 
                            day.isPrevMonth && day.day === 26 ? '26' : 
                            day.day}
                          </Typography>
                          {renderEvents(day.formattedDate)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box> 
      </div>
    </>
  );
};

export default Calendar; 