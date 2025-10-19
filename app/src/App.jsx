import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CanvasManagementProvider } from './contexts/CanvasManagementContext';
import { CanvasProvider } from './contexts/CanvasContext';
import { useAuth } from './hooks/useAuth';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import Navbar from './components/Layout/Navbar';
import Canvas from './components/Canvas/Canvas';
import Dashboard from './components/Dashboard/Dashboard';

// Protected Route Component
function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

// Canvas Page - Main workspace with collaborative canvas
function CanvasPage() {
  const { canvasId } = useParams();
  
  if (!canvasId) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return (
    <CanvasProvider canvasId={canvasId}>
      <div className="h-screen flex flex-col overflow-hidden">
        <Navbar canvasId={canvasId} />
        <div className="flex-1 relative">
          <Canvas />
        </div>
      </div>
    </CanvasProvider>
  );
}

// Main App Component
function AppContent() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      
      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/canvas/:canvasId"
        element={
          <ProtectedRoute>
            <CanvasPage />
          </ProtectedRoute>
        }
      />
      
      {/* Default Route - Redirect to login if not authenticated, dashboard if authenticated */}
      <Route path="/" element={<HomeRedirect />} />
      
      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// Home Redirect Component
function HomeRedirect() {
  const { currentUser } = useAuth();
  return <Navigate to={currentUser ? '/dashboard' : '/login'} replace />;
}

// Root App with Providers
function App() {
  return (
    <Router>
      <AuthProvider>
        <CanvasManagementProvider>
          <AppContent />
        </CanvasManagementProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
