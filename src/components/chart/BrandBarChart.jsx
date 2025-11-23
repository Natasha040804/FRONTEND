import "./chart.scss";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useEffect, useMemo, useState } from "react";
import apiService from "../../utils/api";

// Displays counts of inventory items per branch (x: branch, y: count)
// Falls back gracefully if branch fields are missing.
// NOTE: Avoid passing an array literal as a prop dependency; we create a stable excluded list.
const BrandBarChart = ({ title = "Items per Branch", maxBars = 12, excludeStatuses }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Stable list of statuses to exclude unless caller supplies their own
  const excluded = useMemo(() => {
    if (Array.isArray(excludeStatuses) && excludeStatuses.length) return excludeStatuses;
    return ["Sold", "Redeemed"]; // default
  }, [excludeStatuses]);

  const colorPalette = useMemo(
    () => [
      "#36A2EB",
      "#FF6384",
      "#FFCE56",
      "#4BC0C0",
      "#9966FF",
      "#FF9F40",
      "#7EBF7E",
      "#E87B7B",
      "#5D8AA8",
      "#A4C639",
    ],
    []
  );

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        setError(null);
        // Prefer /api/items; fallback /api/inventory/items as per existing services pattern
        let items = [];
        try {
          items = await apiService.get('/api/items?exclude=' + encodeURIComponent(excluded.join(',')));
        } catch (_) {
          try { items = await apiService.get('/api/inventory/items?exclude=' + encodeURIComponent(excluded.join(','))); } catch { items = []; }
        }

        if (!Array.isArray(items)) items = [];

        // Determine branch name field candidates
        const branchFieldCandidates = [
          'BranchName', 'branchName', 'Branch', 'branch', 'BranchCode', 'BranchRegion', 'BranchCity'
        ];

        const branchCounts = new Map();
        for (const it of items) {
          // Pick first available field value among candidates
            let branchValue = 'Unknown';
            for (const f of branchFieldCandidates) {
              if (it && it[f]) { branchValue = String(it[f]).trim() || 'Unknown'; break; }
            }
            branchCounts.set(branchValue, (branchCounts.get(branchValue) || 0) + 1);
        }

        let entries = Array.from(branchCounts.entries())
          .map(([branch, count]) => ({ branch, count }))
          .sort((a, b) => b.count - a.count);

        if (maxBars && Number.isFinite(maxBars)) entries = entries.slice(0, maxBars);

        setData(entries);
      } catch (e) {
        console.error('BranchBarChart error:', e);
        setError('Failed to load branch inventory summary');
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [maxBars, excluded]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const total = data.reduce((sum, d) => sum + d.count, 0);
      const value = payload[0].value || 0;
      const pct = total ? Math.round((value / total) * 100) : 0;
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{label}</p>
          <p className="tooltip-value">
            Items: <strong>{value.toLocaleString()}</strong> ({pct}%)
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="chart chart--bar">
        <div className="title">{title}</div>
        <div className="chart-loading">Loading brand summary...</div>
      </div>
    );
  }

  return (
    <div className="chart chart--bar">
      <div className="title">{title}</div>
      {error && (
        <div className="chart-error">
          <span className="error-message">{error}</span>
        </div>
      )}
      <div className="barChartInner">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 30 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis 
            dataKey="branch" 
            stroke="#ffffff" 
            tick={{ fill: '#ffffff', fontSize: 12 }}
            tickLine={false} 
            axisLine={false} 
            interval={0} 
            angle={-15} 
            dy={10} 
            height={60}
          />
          <YAxis 
            stroke="#ffffff" 
            tick={{ fill: '#ffffff', fontSize: 12 }}
            tickLine={false} 
            axisLine={false} 
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colorPalette[index % colorPalette.length]} />
            ))}
          </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default BrandBarChart;
