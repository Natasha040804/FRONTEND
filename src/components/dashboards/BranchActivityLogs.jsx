import React from 'react';
import Sidebar from '../sidebar/sidebar';
import ActivityLogsTable from '../activity/ActivityLogsTable';

export default function BranchActivityLogs(){
  return (
    <div className="dashboard">
      <Sidebar />
      <div className="dashboardContainer" style={{padding:24}}>
        <h2 style={{marginTop:0}}>Branch Activity Logs</h2>
        <ActivityLogsTable />
      </div>
    </div>
  );
}
