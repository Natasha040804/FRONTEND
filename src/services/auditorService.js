import api from '../utils/api';

export const auditorService = {
  getAuditorWidgetData: async () => {
    // Server mounts auditorRoutes at /api, and routes use /auditor/* paths
    return api.get('/api/auditor/widget-data');
  }
};

export default auditorService;