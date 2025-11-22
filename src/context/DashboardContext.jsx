import React, { createContext, useContext, useState, useEffect } from 'react';
import { dashboardService } from '../services/dashboardService';

const DashboardContext = createContext();

export const useDashboard = () => {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error('useDashboard must be used within a DashboardProvider');
  return ctx;
};

export const DashboardProvider = ({ children }) => {
  const [dashboardData, setDashboardData] = useState({
    totalInventory: { amount: 0, diff: 0 },
    itemsSoldToday: { count: 0, amount: 0, diff: 0 },
    totalEarnings: { amount: 0, diff: 0 },
    pendingDeliveries: { count: 0, diff: 0 },
    loading: true,
    error: null,
  });

  const fetchDashboardData = async () => {
    try {
      setDashboardData(prev => ({ ...prev, loading: true, error: null }));
      const [totalInventory, itemsSoldToday, totalEarnings, pendingDeliveries] = await Promise.all([
        dashboardService.getTotalInventory(),
        dashboardService.getItemsSoldToday(),
        dashboardService.getTotalEarnings(),
        dashboardService.getPendingDeliveries(),
      ]);
      setDashboardData({
        totalInventory,
        itemsSoldToday,
        totalEarnings,
        pendingDeliveries,
        loading: false,
        error: null,
      });
    } catch (e) {
      console.error('Error fetching dashboard data:', e);
      setDashboardData(prev => ({ ...prev, loading: false, error: 'Failed to load dashboard data' }));
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, []);

  const refreshData = () => fetchDashboardData();

  return (
    <DashboardContext.Provider value={{ dashboardData, refreshData }}>
      {children}
    </DashboardContext.Provider>
  );
};
