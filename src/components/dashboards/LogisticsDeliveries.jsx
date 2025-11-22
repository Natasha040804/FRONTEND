import React from 'react';
import Sidebar from '../sidebar/sidebar';
import "./home.scss";
import TableAssignments from '../table/tblassignmenthistory';
const LogisticsAssignments = () => {
  return (
    <div className="dashboard">
      <Sidebar />
      <div className="dashboardContainer">
        
        <div className="listContainer"> 
        <h1 style={{color:'white'}}>Logistics Assignments History</h1>
        <div style={{ marginTop: '1rem' }}>
          <TableAssignments />
        </div>
        </div>
      </div>
    </div>
  );
};

export default LogisticsAssignments
;
