import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentWeek, getCurrentDate, isToday } from './taskUtils';

const TaskContext = createContext(null);

export const TaskProvider = ({ children }) => {
  const [weekDays, setWeekDays] = useState([]);
  const [currentDate, setCurrentDate] = useState(getCurrentDate());
  const [todayTasks, setTodayTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const updateTasks = () => {
      try {
        const week = getCurrentWeek();
        setWeekDays(week);
        setCurrentDate(getCurrentDate());
        
        const today = week.find(day => isToday(day.fullDate));
        setTodayTasks(today?.tasks || []);
        setIsLoading(false);
      } catch (error) {
        console.error('Erro ao atualizar tarefas:', error);
        setIsLoading(false);
      }
    };

    updateTasks();
    const interval = setInterval(updateTasks, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const value = {
    weekDays,
    currentDate,
    todayTasks,
    isLoading
  };

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TaskContext);
  
  if (context === null) {
    throw new Error('useTasks deve ser usado dentro de um TaskProvider');
  }
  
  return context;
}; 