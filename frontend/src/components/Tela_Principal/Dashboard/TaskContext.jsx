import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentWeek, getCurrentDate, isToday } from './taskUtils';

const TaskContext = createContext();

export const TaskProvider = ({ children }) => {
  const [weekDays, setWeekDays] = useState([]);
  const [currentDate, setCurrentDate] = useState(getCurrentDate());
  const [todayTasks, setTodayTasks] = useState([]);

  // Atualiza a semana e as tarefas quando o componente monta
  useEffect(() => {
    const updateTasks = () => {
      const week = getCurrentWeek();
      setWeekDays(week);
      setCurrentDate(getCurrentDate());
      
      // Encontra as tarefas do dia atual
      const today = week.find(day => isToday(day.fullDate));
      setTodayTasks(today?.tasks || []);
    };

    updateTasks();

    // Atualiza a cada meia hora
    const interval = setInterval(updateTasks, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <TaskContext.Provider value={{ weekDays, currentDate, todayTasks }}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks deve ser usado dentro de um TaskProvider');
  }
  return context;
}; 