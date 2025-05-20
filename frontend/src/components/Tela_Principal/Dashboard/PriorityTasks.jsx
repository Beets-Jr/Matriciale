import React from 'react';
import { Card, CardContent, Typography, Button, Box } from '@mui/material';
import { useTasks } from './TaskContext';

const PriorityTasks = () => {
  const { currentDate, todayTasks } = useTasks();

  const renderTask = (task) => (
    <Box
      key={task.id}
      sx={{
        display: 'flex',
        bgcolor: task.bgColor,
        borderRadius: 1.5,
        p: 2,
        borderLeft: `20px solid ${task.color}`,
        mb: 1
      }}
    >
      <Typography 
        sx={{ 
          flex: 1,
          color: 'text.secondary',
          fontSize: '0.95rem'
        }}
      >
        {task.label}
      </Typography>
      <Button
        variant="contained"
        sx={{
          minWidth: '120px',
          height: '36px'
        }}
      >
        Visualizar
      </Button>
    </Box>
  );

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 2.5, height: '100%' }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          mb: 2.5 
        }}>
          <Typography variant="h6">
            Tarefas Prioritárias
          </Typography>
          <Typography 
            sx={{ 
              color: 'primary.main',
              fontWeight: 500,
              fontSize: '0.95rem'
            }}
          >
            {currentDate}
          </Typography>
        </Box>
        {todayTasks.length > 0 ? (
          todayTasks.map(task => renderTask(task))
        ) : (
          <Typography 
            sx={{ 
              color: 'text.secondary',
              fontSize: '0.95rem',
              textAlign: 'center',
              mt: 2
            }}
          >
            Nenhuma tarefa prioritária para hoje
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default PriorityTasks; 