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
          <Widget type="Branch Total Items Amount" />
          <Widget type="Top Brand" />
      
        </div>
        <div className="charts">
          <Featured />
          <Chart title="Last 6 Months (Revenue)" height={340} />
        </div>
        
      </div>
    </div>
  );
};

export default AEdashboard;