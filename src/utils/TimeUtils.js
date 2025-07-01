// src/utils/TimeUtils.js
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export const TimeUtils = {
  getTimeAgo: (timestamp) => {
    try {
      const date = new Date(timestamp);
      return formatDistanceToNow(date, { 
        addSuffix: true, 
        locale: fr 
      });
    } catch (error) {
      return 'Date invalide';
    }
  },

  formatDuration: (milliseconds) => {
    if (!milliseconds) return '0ms';
    
    if (milliseconds < 1000) {
      return `${milliseconds}ms`;
    }
    
    const seconds = Math.floor(milliseconds / 1000);
    if (seconds < 60) {
      return `${seconds}s`;
    }
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }
};

export default TimeUtils;