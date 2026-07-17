import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Marks from './pages/Marks';
import Homework from './pages/Homework';
import StudentLayout from './components/layout/StudentLayout';

function App() {
  const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('studentToken');
    if (!token) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route 
          element={
            <ProtectedRoute>
              <StudentLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/marks" element={<Marks />} />
          <Route path="/homework" element={<Homework />} />
        </Route>
        
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
