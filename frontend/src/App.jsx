import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProbnikProvider } from './lib/ProbnikProvider.jsx';
import { isAdminAuthenticated } from './lib/marathonApi.js';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import Search from './pages/Search';
import Student from './pages/Student';
import Subjects from './pages/Subjects';
import ProbnikDetail from './pages/ProbnikDetail';
import ErrorMap from './pages/ErrorMap';
import SchoolYear from './pages/SchoolYear';
import Rating from './pages/Rating';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import NotFound from './pages/NotFound';

function RequireAdmin({ children }) {
  if (!isAdminAuthenticated()) return <Navigate to="/admin" replace />;
  return children;
}

export default function App() {
  return (
    <ErrorBoundary>
      <ProbnikProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Search />} />
              <Route path="student/:id" element={<Student />} />
              <Route path="student/:id/probniki" element={<Subjects />} />
              <Route path="student/:id/probniki/:subject" element={<ProbnikDetail />} />
              <Route path="student/:id/errors" element={<ErrorMap />} />
              <Route path="student/:id/year" element={<SchoolYear />} />
              <Route path="rating" element={<Rating />} />
              <Route path="admin" element={<AdminLogin />} />
              <Route path="admin/dashboard" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ProbnikProvider>
    </ErrorBoundary>
  );
}
