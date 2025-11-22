import api from '../utils/api';

export const capitalService = {
  // Get current capital for all branches
  getAllCurrentCapital: async () => {
    const res = await api.get('/capital/current-capital');
    return res.data;
  },

  // Get current capital for specific branch
  getBranchCurrentCapital: async (branchId) => {
    const res = await api.get(`/capital/branches/${branchId}/current-capital`);
    return res.data;
  }
};

export default capitalService;