import apiService from '../utils/api';

// apiService returns parsed JSON directly (not an axios-style { data })
const unwrap = (resp) => (resp && typeof resp === 'object' && 'data' in resp ? resp.data : resp);

export const dashboardService = {
  getTotalInventory: async () => unwrap(await apiService.get('/api/dashboard/total-inventory')),
  getItemsSoldToday: async () => unwrap(await apiService.get('/api/dashboard/items-sold-today')),
  getTotalEarnings: async () => unwrap(await apiService.get('/api/dashboard/total-earnings')),
  getPendingDeliveries: async () => unwrap(await apiService.get('/api/dashboard/pending-deliveries')),
};
