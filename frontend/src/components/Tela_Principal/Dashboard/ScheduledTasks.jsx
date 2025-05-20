import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, Typography, Button, Grid, Box, Divider } from '@mui/material';
import { useTasks } from './TaskContext';

const ScheduledTasks = () => {
  const navigate = useNavigate();
  const { weekDays } = useTasks();

  const handleViewMore = () => {
    navigate('/calendar');
  };

  const renderTask = (task) => (
    <Box
      key={task.id}
      sx={{
        bgcolor: task.bgColor,
        borderRadius: '16px 16px 16px 16px',
        overflow: 'hidden',
        position: 'relative',
        mb: 1,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '20px',
          bgcolor: task.color
        }
      }}
    >
      <Box
        sx={{
          p: 2,
          pt: 2.5,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '90px',
        }}
      >
        <Typography 
          align="center"
          sx={{ 
            color: '#555',
            fontSize: '0.9rem',
            lineHeight: 1.4
          }}
        >
          {task.label}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Card>
      <CardContent sx={{ p: 3 }}>
        <Typography 
          variant="h6" 
          color="primary" 
          align="center" 
          sx={{ mb: 3 }}
        >
          Tarefas Agendadas
        </Typography>
        <Box>
          <Grid container spacing={0}>
            {weekDays.map((dayInfo, index) => (
              <React.Fragment key={dayInfo.day}>
                <Grid 
                  item 
                  xs={12} 
                  sm={2.4} 
                  sx={{ 
                    position: 'relative',
                    px: 1
                  }}
                >
                  <Box sx={{ 
                    textAlign: 'center', 
                    mb: 1.5,
                    borderBottom: '2px solid',
                    borderColor: 'primary.main',
                    pb: 0.5
                  }}>
                    <Typography 
                      color="error"
                      sx={{ 
                        fontWeight: 500,
                        fontSize: '0.95rem'
                      }}
                    >
                      {dayInfo.day}
                    </Typography>
                    <Typography 
                      color="error"
                      sx={{ 
                        fontSize: '0.85rem'
                      }}
                    >
                      {dayInfo.date}
                    </Typography>
                  </Box>
                  <Box sx={{ minHeight: '300px' }}>
                    {dayInfo.tasks.map(task => renderTask(task))}
                  </Box>
                  {index < weekDays.length - 1 && (
                    <Divider 
                      orientation="vertical" 
                      sx={{ 
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        bottom: 0,
                        borderColor: 'rgba(0, 0, 0, 0.12)'
                      }} 
                    />
                  )}
                </Grid>
              </React.Fragment>
            ))}
          </Grid>
        </Box>
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Button 
            variant="contained"
            sx={{ 
              minWidth: '140px',
              height: '40px'
            }}
            onClick={handleViewMore}
          >
            Ver Mais
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ScheduledTasks; 