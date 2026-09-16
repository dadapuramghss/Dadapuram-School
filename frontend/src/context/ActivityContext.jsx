import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../lib/api';

const ActivityContext = createContext();

export function useActivity() {
  return useContext(ActivityContext);
}

export function ActivityProvider({ children }) {
  const { currentUser, dbUser } = useAuth();
  const [activeStandard, setActiveStandard] = useState(null);
  const [activeSection, setActiveSection] = useState(null);
  const intervalRef = useRef(null);
  const lastStateRef = useRef({ activeStandard: null, activeSection: null });

  // Update the ref whenever state changes so the interval always has the latest values
  useEffect(() => {
    lastStateRef.current = { activeStandard, activeSection };
  }, [activeStandard, activeSection]);

  const sendHeartbeat = async () => {
    if (!currentUser || !dbUser) return;
    try {
      await api.post('/users/activity/heartbeat', lastStateRef.current);
    } catch (err) {
      console.error('Failed to send heartbeat:', err);
    }
  };

  useEffect(() => {
    // Start heartbeat only if user is logged in
    if (currentUser && dbUser) {
      // Send an immediate heartbeat on mount/login
      sendHeartbeat();
      
      // Set interval for every 2 minutes (120000 ms)
      intervalRef.current = setInterval(sendHeartbeat, 120000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [currentUser, dbUser]);

  const setActivityContext = (standard, section) => {
    setActiveStandard(standard === 'All' ? null : standard || null);
    setActiveSection(section === 'All' ? null : section || null);
    
    // Optionally trigger immediate heartbeat when context changes
    setTimeout(sendHeartbeat, 500); 
  };

  const clearActivityContext = () => {
    setActiveStandard(null);
    setActiveSection(null);
    setTimeout(sendHeartbeat, 500);
  };

  return (
    <ActivityContext.Provider value={{ setActivityContext, clearActivityContext }}>
      {children}
    </ActivityContext.Provider>
  );
}
