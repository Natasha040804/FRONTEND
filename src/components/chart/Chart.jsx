import "./chart.scss";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useEffect, useState } from "react";
import { chartService } from "../../services/chartService";

// Responsive Chart component: prefers explicit height over aspect for stability.
// Pass `height` prop (e.g., 380) to avoid overly tall/short charts on wide screens.
const Chart = ({ aspect, title, height }) => {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Generate dates for the current month
  const getCurrentMonthDates = () => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const dates = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      dates.push({
        date: date.toISOString().split('T')[0],
        displayDate: day.toString(),
        fullDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      });
    }
    return dates;
  };

  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        setLoading(true);
        setError(null);
        const salesData = await chartService.getDailySalesCurrentMonth();
        if (!salesData || salesData.length === 0) {
          // Fallback handled in service, but double-guard here
          setError('Using sample data - no sales records found for current month');
        }
        setChartData(salesData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching sales data:', error);
        setError('Failed to load sales data');
        // Fallback already produced by service; still ensure something renders
        const monthDates = getCurrentMonthDates();
        const mockData = monthDates.map(dateObj => ({
          ...dateObj,
          Total: Math.floor(Math.random() * 3000) + 500
        }));
        setChartData(mockData);
        setLoading(false);
      }
    };
    fetchSalesData();
  }, []);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = chartData.find(item => item.displayDate === label);
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{data?.fullDate || label}</p>
          <p className="tooltip-value">
            Sales: <strong>₱{payload[0].value.toLocaleString('en-PH')}</strong>
          </p>
        </div>
      );
    }
    return null;
  };

  const formatYAxis = (value) => `₱${Number(value).toLocaleString('en-PH')}`;
  const yTicks = [20000, 40000, 60000, 80000, 100000];

  if (loading) {
    return (
      <div className="chart">
        <div className="title">{title}</div>
        <div className="chart-loading">Loading sales data...</div>
      </div>
    );
  }

  // Determine responsive container sizing: explicit height > aspect > fallback height
  const containerSizing = {};
  if (height) {
    containerSizing.height = height; // explicit height ensures stable layout
  } else if (aspect) {
    containerSizing.aspect = aspect; // legacy usage
  } else {
    containerSizing.height = 360; // sensible default
  }

  return (
    <div className="chart">
      <div className="title">{title}</div>
      {error && (
        <div className="chart-error">
          <span className="error-message">{error}</span>
        </div>
      )}
      <ResponsiveContainer width="100%" {...containerSizing}>
        <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <defs>
            <linearGradient id="total" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f5d109" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#f5d109" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="totalShadow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f5d109" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f5d109" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="displayDate" stroke="white" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis 
            stroke="white" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            tickFormatter={formatYAxis} 
            ticks={yTicks}
            domain={[0, 100000]}
            width={70}
          />
          <CartesianGrid strokeDasharray="3 3" className="chartGrid" vertical={false} stroke="#f1f3f4" />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="Total"
            stroke="#f5d109"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#total)"
            dot={{ fill: '#f5d109', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#f5d109', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Chart;