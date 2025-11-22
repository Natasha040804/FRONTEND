import React from 'react';
import Sidebar from "../../components/sidebar/sidebar";
import "./home.scss";
import Table from "../../components/table/Table"; 

const BranchItems = () => {
  const [refreshKey,] = React.useState(0);
 


  return (
    <div className="dashboard">
      <Sidebar />
      <div className="dashboardContainer">
        <div className="listContainer">
          <Table refreshKey={refreshKey} />
        </div>
      </div>
    </div>
  );
};

export default BranchItems;  