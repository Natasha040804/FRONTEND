import Sidebar from "../sidebar/sidebar";
import "./home.scss";
import Widget from "../../components/widget/Widgets";
import { useEffect, useState } from "react";
import { auditorService } from "../../services/auditorService";
import BranchCapitalCards from "../../components/capital/BranchCapitalCards";
import apiService from "../../utils/api"; // for branch count


const CapitalInventory = () => {
  const [widgetData, setWidgetData] = useState({
    totalInventory: { amount: 0, diff: 0 },
    totalCapital: { amount: 0, diff: 0 },
    totalBalance: { amount: 0, diff: 0 },
    totalRedeems: { amount: 0, diff: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [branchCount, setBranchCount] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const data = await auditorService.getAuditorWidgetData();
        if (!active) return;
        setWidgetData(data);
        // Fetch branches for count
        try {
          const branches = await apiService.get('/api/branches');
          if (active && Array.isArray(branches)) {
            setBranchCount(branches.length);
          }
        } catch (branchErr) {
          console.warn('Branch count fetch failed:', branchErr?.message || branchErr);
          if (active) setBranchCount(null);
        }
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
                type="Total Branch" 
                count={branchCount !== null ? branchCount : '—'}
                diff={0}
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
              <Widget 
                type="Total Redeems" 
                amount={widgetData.totalRedeems.amount}
                diff={widgetData.totalRedeems.diff}
              />
            </>
          )}
        </div>
        <div className="listContainer">
          <BranchCapitalCards />
        </div>
        
      </div>
    </div>
  );
};

export default CapitalInventory;