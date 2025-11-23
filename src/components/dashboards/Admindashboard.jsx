import Sidebar from "../sidebar/sidebar";
import "./home.scss";
import Widget from "../../components/widget/Widgets";
import Featured from "../../components/featured/Featured";
import Chart from "../../components/chart/Chart";
import BrandBarChart from "../../components/chart/BrandBarChart";
import { useDashboard } from "../../context/DashboardContext";

const Admindashboard = () => {
  const { dashboardData } = useDashboard();

  if (dashboardData.loading) {
    return (
      
      <div className="dashboard">
        <Sidebar />
        <div className="dashboardContainer"><div className="loading">Loading dashboard data...</div></div>
      </div>
    );
  }

  if (dashboardData.error) {
    return (
      <div className="dashboard">
        <Sidebar />
        <div className="dashboardContainer"><div className="error">{dashboardData.error}</div></div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="dashboardContainer">
        <div className="widgets">
          <Widget type="Total Inventory Amount" amount={dashboardData.totalInventory.amount} diff={dashboardData.totalInventory.diff} link="View all inventory" />
          <Widget type="Total Earnings" amount={dashboardData.totalEarnings.amount} diff={dashboardData.totalEarnings.diff} link="View earnings report" />
          <Widget type="Pending Deliveries" amount={dashboardData.pendingDeliveries.count} diff={dashboardData.pendingDeliveries.diff} link="Track deliveries" />
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

export default Admindashboard;