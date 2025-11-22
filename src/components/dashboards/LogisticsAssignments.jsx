import React from 'react';
import Sidebar from '../sidebar/sidebar';
import "./home.scss";
import Widget from '../widget/admininventorywidgets';
import TableAssignments from '../table/TableAssignments';
const LogisticsAssignments = () => {
  return (
    <div className="dashboard">
      <Sidebar />
      <div className="dashboardContainer">
        <div className="widgets">
          <Widget type="Total Assignments" count={0} />
          <Widget type="Item transfer" count={0} />
          <Widget type="Cash-In" count={0} />
          <Widget type="Cash-Out" count={0} />
        </div>
        <div className="listContainer">
        <h1 style={{color:'white'}}>Logistics Assignments</h1>
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
