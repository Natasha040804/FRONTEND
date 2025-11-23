import Sidebar from "../sidebar/sidebar";
import "./home.scss";
import Featured from "../../components/featured/Featured";
import Chart from "../../components/chart/Chart";
import { useAuth } from "../../context/authContext";
import { useMemo } from "react";
import Widget from "../widget/admininventorywidgets"; 
const AEdashboard = () => {
  const { branchStatus } = useAuth();

  // Branch banner removed per request; preserving hook dependency to avoid unused variable warnings
  useMemo(() => branchStatus, [branchStatus]);

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="dashboardContainer">
       <div className="widgets">
        </div>
        <div className="charts chartsGrid">
          <div className="gridDonut">
            <Featured />
          </div>
          <div className="gridWidget">
            <Widget type="Branch Total Items Amount" />
          </div>
          <div className="gridChart">
          {(() => {
            const now = new Date();
            const monthName = now.toLocaleString('en-US', { month: 'long' });
            const year = now.getFullYear();
            return (
          <Chart title={`Sales for ${monthName} ${year}`} height={330} />
            );
          })()}
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default AEdashboard;