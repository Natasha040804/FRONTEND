import apiService from '../utils/api';

export const featuredService = {
  getSoldItemsByBrand: async () => {
    const resp = await apiService.get('/api/dashboard/sold-items-by-brand');
    return resp?.data ?? resp;
  },
  // Inventory widgets counts
  getInventoryCounts: async () => {
    // Fetch all items and aggregate statuses (Vault, Display, Redeemed, Sold, etc.)
    let items = [];
    try {
      // Primary route as mounted in server.js
      items = await apiService.get('/api/items');
    } catch (_) {
      // Fallback for older deployments where inventory routes were under /api/inventory
      try { items = await apiService.get('/api/inventory/items'); } catch (_) { items = []; }
    }
    const totals = {
      total: 0,
      vault: 0,
      display: 0,
      reclaimed: 0,
    };
    if (Array.isArray(items)) {
      for (const it of items) {
        const status = (it.ItemStatus || '').toLowerCase();
        if (status === 'vault') totals.vault += 1;
        else if (status === 'display') totals.display += 1;
        else if (status === 'redeemed') totals.reclaimed += 1;
      }
      // Items Count = Vault + Display only (exclude Sold, Redeemed, etc.)
      totals.total = totals.vault + totals.display;
    }
    return totals;
  }
};
