import React from 'react';
import Sidebar from "../../components/sidebar/sidebar";
import "./home.scss";
import Widget from "../../components/widget/admininventorywidgets";
import Table from "../../components/table/Table"; 

const BranchBalance = () => {
  const [refreshKey, ] = React.useState(0);


  return (
    <div className="dashboard">
      <Sidebar />
      <div className="dashboardContainer">
        
        <div className="widgets">
          <Widget type="Branch Total Item" />
          <Widget type="Branch Total Items Amount" />
        </div>
        
        <div className="listContainer">
          
          <Table refreshKey={refreshKey} />
        </div>
      </div>
    </div>
  );
};

export default BranchBalance;