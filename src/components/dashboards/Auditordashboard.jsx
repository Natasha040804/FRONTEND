import Sidebar from "../sidebar/sidebar";
import "./home.scss";
import Widget from "../../components/widget/Widgets";
import Featured from "../../components/featured/Featured";
import Chart from "../../components/chart/Chart";
import BrandBarChart from "../../components/chart/BrandBarChart";
import { useEffect, useState } from "react";
import { auditorService } from "../../services/auditorService";


const Auditordashboard = () => {
  const [widgetData, setWidgetData] = useState({
    totalInventory: { amount: 0, diff: 0 },
    totalCapital: { amount: 0, diff: 0 },
    totalBalance: { amount: 0, diff: 0 },
    totalRedeems: { amount: 0, diff: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
  const data = await auditorService.getAuditorWidgetData();
        if (!active) return;
        setWidgetData(data);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch auditor widget data:', err);
        if (!active) return;
        setError('Failed to load dashboard data');
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="dashboardContainer">
        <div className="widgets">
          {loading ? (
            <div>Loading...</div>
          ) : error ? (
            <div>{error}</div>
          ) : (
            <>
              <Widget 
                type="Total Inventory" 
                amount={widgetData.totalInventory.amount}
                diff={widgetData.totalInventory.diff}
              />
              <Widget 
                type="Total Capital" 
                amount={widgetData.totalCapital.amount}
                diff={widgetData.totalCapital.diff}
              />
              <Widget 
                type="Total Balance" 
                amount={widgetData.totalBalance.amount}
                diff={widgetData.totalBalance.diff}
              />
            </>
          )}
        </div>
        <div className="charts">
          {(() => {
            const now = new Date();
            const monthName = now.toLocaleString('en-US', { month: 'long' });
            const year = now.getFullYear();
            return (
              <Chart title={`Sales for ${monthName} ${year}`} height={380} />
            );
          })()}
        </div>
        <div className="chartsRow">
          <Featured />
          <BrandBarChart />
        </div>
      </div>
    </div>
  );
};

export default Auditordashboard;