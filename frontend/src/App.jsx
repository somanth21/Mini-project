import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import HotelDashboard from './pages/HotelDashboard';
import NGODashboard from './pages/NGODashboard';
import AdminDashboard from './pages/AdminDashboard';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import { useAuth } from './hooks/useAuth';
import { ProtectedRoute, RoleProtectedRoute } from './components/ProtectedRoute';

function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<RoleProtectedRoute allowedRoles={['HOTEL']} />}>
                <Route path="/hotel/*" element={<HotelDashboard />} />
              </Route>
              
              <Route element={<RoleProtectedRoute allowedRoles={['NGO']} />}>
                <Route path="/ngo/*" element={<NGODashboard />} />
              </Route>
              
              <Route element={<RoleProtectedRoute allowedRoles={['ADMIN']} />}>
                <Route path="/admin/*" element={<AdminDashboard />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
