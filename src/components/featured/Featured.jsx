import "./featured.scss";
import { Doughnut } from "react-chartjs-2";
import { useEffect, useState, useMemo, useRef } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { featuredService } from "../../services/featuredService";

ChartJS.register(ArcElement, Tooltip, Legend);

const Featured = () => {
  const [chartData, setChartData] = useState(null);
  const [totalSold, setTotalSold] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const colorPalette = useMemo(() => ([
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
    '#FF9F40', '#C9CBCF', '#7EBF7E', '#E87B7B', '#5D8AA8',
    '#FFBF00', '#A4C639', '#FBCEB1', '#7FFFD4', '#2ECC71'
  ]), []);

  useEffect(() => {
    const fetchSoldItemsByBrand = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await featuredService.getSoldItemsByBrand();
        // response expected as { BrandName: count, ... }
        const total = Object.values(response).reduce((sum, c) => sum + c, 0);
        setTotalSold(total);
        // Filter out zero-count brands for a cleaner donut
        const allBrands = Object.keys(response);
        const allCounts = Object.values(response);
        const entries = allBrands
          .map((b, i) => ({ brand: b, count: allCounts[i] }))
          .filter((e) => Number(e.count) > 0);
        const brands = entries.map((e) => e.brand);
        const counts = entries.map((e) => e.count);
        const data = {
          labels: brands,
          datasets: [
            {
              data: counts,
              backgroundColor: colorPalette.slice(0, brands.length),
              borderColor: '#fff',
              borderWidth: 2,
              hoverOffset: 8,
              spacing: 2,
              borderRadius: 6,
            },
          ],
        };
        setChartData(data);
      } catch (e) {
        console.error('Error fetching sold items data:', e);
        setError('Failed to load chart');
      } finally {
        setLoading(false);
      }
    };
    fetchSoldItemsByBrand();
  }, [colorPalette]);

  const chartRef = useRef(null);
  const centerRef = useRef(null);
  const [centerStyle, setCenterStyle] = useState({});

  const recenter = () => {
    const chartInstance = chartRef.current;
    if (!chartInstance || !centerRef.current) return;
    const { chartArea } = chartInstance; // area excluding legend
    if (!chartArea || !chartArea.width) return;
    const cx = (chartArea.left + chartArea.right) / 2;
    const cy = (chartArea.top + chartArea.bottom) / 2;
    // Position center element at donut center
    setCenterStyle({ left: cx + 'px', top: cy + 'px', transform: 'translate(-50%, -50%)' });
  };

  useEffect(() => {
    // recenter after data load & on resize
    recenter();
    const handleResize = () => recenter();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [chartData]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
          font: { size: 11, weight: '500' },
          color: '#f5d109',
        },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = total ? Math.round((value / total) * 100) : 0;
            return `${label}: ${value} items (${percentage}%)`;
          }
        },
        backgroundColor: 'rgba(0,0,0,0.8)',
        titleFont: { size: 12 },
        bodyFont: { size: 11 },
        padding: 10
      }
    },
    cutout: '65%'
  };

  return (
    <div className="featured">
      <div className="top">
        <h1 className="title">Brands Popularity</h1>

      </div>
      <div className="bottom">
        {loading ? (
          <div className="loading">Loading chart data...</div>
        ) : error ? (
          <div className="loading">{error}</div>
        ) : (
          <div className="chartContainer">
            {chartData && <Doughnut ref={chartRef} data={chartData} options={chartOptions} />}
            <div className="chartCenter" ref={centerRef} style={centerStyle}>
              <div className="centerValue">{totalSold.toLocaleString()}</div>
              <div className="centerLabel">Total Sold</div>
            </div>
          </div>
        )}
        <p className="amount">{totalSold.toLocaleString()} </p>
        <div className="summary">
          <div className="item">
            <div className="itemTitle">Top Brand</div>
            <div className="itemResult positive">
              <div className="resultAmount">{chartData && chartData.labels[0]}</div>
            </div>
          </div>
            <div className="item">
            <div className="itemTitle">Total Brands</div>
            <div className="itemResult positive">
              <div className="resultAmount">{chartData ? chartData.labels.length : 0}</div>
            </div>
          </div>
          <div className="item">
            <div className="itemTitle">Last Updated</div>
            <div className="itemResult">
              <div className="resultAmount">Today</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Featured;