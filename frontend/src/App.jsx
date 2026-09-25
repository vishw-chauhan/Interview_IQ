import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Signup from './pages/Signup.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Resumes from './pages/Resumes.jsx';
import NotFound from './pages/NotFound.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import DashboardLayout from './layouts/DashboardLayout.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/resumes" element={<Resumes />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}