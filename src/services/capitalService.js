import api from '../utils/api';

export const capitalService = {
  // Get current capital for all branches
  getAllCurrentCapital: async () => {
    const res = await api.get('/api/capital/current-capital');
    return res?.data ?? res;
  },

  // Get current capital for specific branch
  getBranchCurrentCapital: async (branchId) => {
    const res = await api.get(`/api/capital/branches/${branchId}/current-capital`);
    return res?.data ?? res;
  }
};

export default capitalService;