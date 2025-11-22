import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/authContext';
import { DashboardProvider } from './context/DashboardContext';
import Login from './components/Login/Login';
import { ThemeProvider } from './context/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';
import ProtectedRoute from './components/routes/ProtectedRoute';
import Admindashboard from './components/dashboards/Admindashboard';
import Auditordashboard from './components/dashboards/Auditordashboard';
import AEdashboard from './components/dashboards/AEdashboard';
import InventoryActivity from './components/dashboards/InventoryActivity';
import DeliveryRequests from './components/dashboards/DeliveryRequests';
import DeliveryActivity from './components/dashboards/DeliveryActivity';
import InventoryItems from './components/dashboards/InventoryItems';
import UserManagement from './components/dashboards/UserManagement';
import UserApproval from './components/dashboards/UserApproval';
import BranchInventory from './components/dashboards/BranchCapitalInv';
import CapitalInventory from './components/dashboards/CapitalInventory';
import AssignDelivery from './components/delivery/AssignDelivery';
import TrackDelivery from './components/delivery/TrackDelivery';
import AdminActivityLogs from './components/dashboards/AdminActivityLogs';
import AuditorActivityLogs from './components/dashboards/auditorActivityLogs';
import BranchActivityLogs from './components/dashboards/BranchActivityLogs';
import BranchAccess from './components/branchAccess/BranchAccess';
import LogisticsDeliveries from './components/dashboards/LogisticsDeliveries';
import LogisticsAssignments from './components/dashboards/LogisticsAssignments';
import Loan from './components/dashboards/Loan';
import AESale from './components/dashboards/AESale';
import AEREdeem from './components/dashboards/AEREdeem';
import Message from './components/dashboards/Message';
import Chat from './components/Message/message';
function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ThemeProvider>
          <AuthProvider>
            <DashboardProvider>
            <Routes>
              <Route path="/" element={<Login />} />

              <Route
                path="/dashboards/Admindashboard"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <Admindashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/inventory-activity"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <InventoryActivity />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/delivery-requests"
                element={
                  <ProtectedRoute allowedRoles={["admin","auditor","accountexecutive"]}>
                    <DeliveryRequests />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/delivery-activity"
                element={
                  <ProtectedRoute allowedRoles={["admin","auditor"]}>
                    <DeliveryActivity />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/activity/admin"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <AdminActivityLogs />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/activity/auditor"
                element={
                  <ProtectedRoute allowedRoles={["auditor"]}>
                    <AuditorActivityLogs />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/activity/branch"
                element={
                  <ProtectedRoute allowedRoles={["AccountExecutive"]}>
                    <BranchActivityLogs />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/dashboards/Auditordashboard"
                element={
                  <ProtectedRoute allowedRoles={["auditor"]}>
                    <Auditordashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/dashboards/AEdashboard"
                element={
                  <ProtectedRoute allowedRoles={["AccountExecutive"]}>
                    <AEdashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/loan"
                element={
                  <ProtectedRoute allowedRoles={["AccountExecutive"]}>
                    <Loan />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/logistics-deliveries"
                element={
                  <ProtectedRoute allowedRoles={["admin","AccountExecutive","auditor"]}>      
                    <LogisticsDeliveries />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/logistics-assignments"
                element={
                  <ProtectedRoute allowedRoles={["admin","AccountExecutive","auditor"]}>      
                    <LogisticsAssignments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/sale"
                element={
                  <ProtectedRoute allowedRoles={["AccountExecutive"]}>
                    <AESale />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/redeem"
                element={
                  <ProtectedRoute allowedRoles={["AccountExecutive"]}>
                    <AEREdeem />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/branch-access"
                element={
                  <ProtectedRoute allowedRoles={["AccountExecutive"]}>
                    <BranchAccess />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<Navigate to="/" replace />} />
              <Route path="/branchinventory" element={<BranchInventory/>} />
              <Route
                path="/branch-capital-inv"
                element={
                  <ProtectedRoute allowedRoles={["AccountExecutive"]}>
                    <BranchInventory />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/user-approvals"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <UserApproval />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/capital-inventory"
                element={
                  <ProtectedRoute allowedRoles={["auditor"]}>
                    <CapitalInventory />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/inventory-items"
                element={
                  <ProtectedRoute allowedRoles={["admin", "auditor"]}>
                    <InventoryItems />
                  </ProtectedRoute>
                }
              />
              <Route path="/user-management" element={<UserManagement />} />
                  
              {/* New routes for assigning and tracking */}
              <Route
                path="/delivery-assign/:personnelId"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <AssignDelivery />
                  </ProtectedRoute>
                }
                
              />
              <Route
                path="/delivery-tracking/:personnelId"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <TrackDelivery />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/messages"
                element={
                  <ProtectedRoute allowedRoles={["admin", "auditor", "AccountExecutive"]}>
                    <Message />
                  </ProtectedRoute>
                }
            
              />
              <Route
                path="/messages/chat"
                element={
                  <ProtectedRoute allowedRoles={["admin", "auditor", "AccountExecutive"]}>
                    <Chat />
                  </ProtectedRoute>
                }
              />
            </Routes>
            </DashboardProvider>
          </AuthProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </BrowserRouter>  
  );
}

export default App;