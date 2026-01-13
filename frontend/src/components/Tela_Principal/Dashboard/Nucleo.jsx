import React from 'react';
import { Box, Grid } from '@mui/material';
import PriorityTasks from './PriorityTasks';
import StockChart from './StockChart';
import ScheduledTasks from './ScheduledTasks';
import { TaskProvider } from './TaskContext';

const Nucleo = () => {
  return (
    <TaskProvider>
      <Box
        sx={{
          p: 3,
          width: '80%',
          minHeight: 'calc(100vh - 64px)',
          marginLeft: '20%'
        }}
      >
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <PriorityTasks />
          </Grid>
          <Grid item xs={12} md={6}>
            <StockChart />
          </Grid>
          <Grid item xs={12}>
            <ScheduledTasks />
          </Grid>
        </Grid>
      </Box>
    </TaskProvider>
  );
};

export default Nucleo; 