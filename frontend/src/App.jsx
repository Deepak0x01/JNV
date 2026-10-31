import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import DashboardLayout from "./components/DashboardLayout";

import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import Logout from "./pages/Logout";
import Dashboard from "./pages/Dashboard";
import MyDetails from "./pages/MyDetails";
import Admins from "./pages/Admins";
import Students from "./pages/Students";
import AddStudent from "./pages/AddStudent";
import StudentView from "./pages/StudentView";
import Rooms from "./pages/Rooms";
import RoomAllocation from "./pages/RoomAllocation";
import Fees from "./pages/Fees";
import Complaints from "./pages/Complaints";
import AddComplaint from "./pages/AddComplaint";
import Reports from "./pages/Reports";
import StudentListReport from "./pages/StudentListReport";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";

function Home() {
  const { isStudent } = useAuth();
  return isStudent ? <MyDetails /> : <Dashboard />;
}

function AdminOnly({ children }) {
  const { isStudent } = useAuth();
  return isStudent ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/logout" element={<Logout />} />

          <Route element={<DashboardLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/fees" element={<Fees />} />
            <Route path="/complaints" element={<Complaints />} />
            <Route path="/complaints/add" element={<AddComplaint />} />
            <Route path="/profile" element={<Profile />} />

            <Route path="/students" element={<AdminOnly><Students /></AdminOnly>} />
            <Route path="/students/add" element={<AdminOnly><AddStudent /></AdminOnly>} />
            <Route path="/students/:id" element={<AdminOnly><StudentView /></AdminOnly>} />
            <Route path="/students/:id/edit" element={<AdminOnly><AddStudent /></AdminOnly>} />
            <Route path="/rooms" element={<AdminOnly><Rooms /></AdminOnly>} />
            <Route path="/allocations" element={<AdminOnly><RoomAllocation /></AdminOnly>} />
            <Route path="/admins" element={<AdminOnly><Admins /></AdminOnly>} />
            <Route path="/reports" element={<AdminOnly><Reports /></AdminOnly>} />
            <Route path="/reports/students" element={<AdminOnly><StudentListReport /></AdminOnly>} />
            <Route path="/settings" element={<AdminOnly><Settings /></AdminOnly>} />
            <Route path="/notifications" element={<AdminOnly><Notifications /></AdminOnly>} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
