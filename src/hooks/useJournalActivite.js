// src/hooks/useJournalActivite.js
import { useState, useEffect, useCallback } from 'react';
import journalActiviteService from '../services/journalActiviteService';
import { useAuth } from './useAuth';
import { format } from 'date-fns';

export const useJournalActivite = (initialDate = new Date()) => {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [stats, setStats] = useState(null);

  const loadActivities = useCallback(async (date = selectedDate) => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const dateString = format(date, 'yyyy-MM-dd');
      const response = await journalActiviteService.getUserActivities(
        user.id,
        dateString
      );

      if (response.success) {
        setActivities(response.data.content || []);
      }
    } catch (err) {
      setError(err.message);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, selectedDate]);

  const loadStats = useCallback(async (date = selectedDate) => {
    if (!user?.id) return;

    try {
      const dateString = format(date, 'yyyy-MM-dd');
      const response = await journalActiviteService.getUserActivityStats(
        user.id,
        dateString,
        dateString
      );

      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Erreur chargement stats:', err);
    }
  }, [user?.id, selectedDate]);

  const changeDate = useCallback((newDate) => {
    setSelectedDate(newDate);
  }, []);

  const refresh = useCallback(() => {
    loadActivities(selectedDate);
    loadStats(selectedDate);
  }, [loadActivities, loadStats, selectedDate]);

  useEffect(() => {
    loadActivities(selectedDate);
    loadStats(selectedDate);
  }, [selectedDate]);

  return {
    activities,
    loading,
    error,
    selectedDate,
    stats,
    changeDate,
    refresh,
    loadActivities
  };
};