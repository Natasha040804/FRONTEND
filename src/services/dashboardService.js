import apiService from '../utils/api';

export const dashboardService = {
  getTotalInventory: async () => {
    const resp = await apiService.get('/api/dashboard/total-inventory');
    return resp.data ?? resp;
  },
  getItemsSoldToday: async () => {
    const resp = await apiService.get('/api/dashboard/items-sold-today');
    return resp.data ?? resp;
  },
  getTotalEarnings: async () => {
    const resp = await apiService.get('/api/dashboard/total-earnings');
    return resp.data ?? resp;
  },
  getPendingDeliveries: async () => {
    const resp = await apiService.get('/api/dashboard/pending-deliveries');
    return resp.data ?? resp;
  }
};
