import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Signup from './pages/Signup.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Resumes from './pages/Resumes.jsx';
import ResumeDetail from './pages/ResumeDetail.jsx';
import NewInterview from './pages/NewInterview.jsx';
import InterviewDetail from './pages/InterviewDetail.jsx';
import InterviewSession from './pages/InterviewSession.jsx';
import InterviewFeedback from './pages/InterviewFeedback.jsx';
import InterviewReport from './pages/InterviewReport.jsx';
import InterviewAnalytics from './pages/InterviewAnalytics.jsx';
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
        <Route path="/resumes/:id" element={<ResumeDetail />} />
        <Route path="/interviews/new" element={<NewInterview />} />
        <Route path="/interviews/:id" element={<InterviewDetail />} />
        <Route path="/interviews/:id/session" element={<InterviewSession />} />
        <Route path="/interviews/:id/feedback" element={<InterviewFeedback />} />
        <Route path="/interviews/:id/report" element={<InterviewReport />} />
        <Route path="/interviews/:id/analytics" element={<InterviewAnalytics />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}