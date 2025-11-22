import React from 'react';
import Sidebar from '../sidebar/sidebar';
import ActivityLogsTable from '../activity/ActivityLogsTable';

export default function AdminActivityLogs(){
  return (
    <div className="dashboard">
      <Sidebar />
      <div className="dashboardContainer" style={{padding:24}}>
        <ActivityLogsTable />
      </div>
    </div>
  );
}
