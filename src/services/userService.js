import apiService from '../utils/api';

export const userService = {
  getAllUsers: async () => {
    // Returns array of users
    const resp = await apiService.get('/api/users');
    return Array.isArray(resp) ? resp : (resp?.data ?? []);
  },
  getTotalUsersCount: async () => {
    const users = await userService.getAllUsers();
    return users.length;
  },
  getCountByRole: async (role) => {
    const resp = await apiService.get(`/api/users/role/${encodeURIComponent(role)}`);
    // Endpoint returns { success, data, count }
    if (resp && typeof resp.count === 'number') return resp.count;
    const data = resp?.data;
    if (Array.isArray(data)) return data.length;
    return 0;
  },
};

export default userService;
