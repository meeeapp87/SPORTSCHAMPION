import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import StudentFormPage from "@/pages/StudentFormPage";
import StudentListPage from "@/pages/StudentListPage";
import StudentDetailPage from "@/pages/StudentDetailPage";
import SchoolDetailPage from "@/pages/SchoolDetailPage";
import AdminPage from "@/pages/AdminPage";
import ComparisonPage from "@/pages/ComparisonPage";
import SchoolPortalPage from "@/pages/SchoolPortalPage";
import TrainerPortalPage from "@/pages/TrainerPortalPage";
import SchoolsListPage from "@/pages/SchoolsListPage";
import RecordsPage from "@/pages/RecordsPage";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#8A1538] border-t-transparent"></div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function RoleRedirect() {
  const { user } = useAuth();
  if (user?.role === "school_user") return <Navigate to="/school-portal" replace />;
  if (user?.role === "trainer") return <Navigate to="/trainer" replace />;
  return <DashboardPage />;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#8A1538] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<RoleRedirect />} />
        <Route path="school-portal" element={<SchoolPortalPage />} />
        <Route path="trainer" element={<TrainerPortalPage />} />
        <Route path="students/new" element={<StudentFormPage />} />
        <Route path="students/:id/edit" element={<StudentFormPage />} />
        <Route path="students/:id" element={<StudentDetailPage />} />
        <Route path="students" element={<StudentListPage />} />
        <Route path="schools/:id" element={<SchoolDetailPage />} />
        <Route path="comparison" element={<ComparisonPage />} />
        <Route path="schools-list" element={<SchoolsListPage />} />
        <Route path="records" element={<RecordsPage />} />
        <Route path="admin" element={<AdminPage />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
