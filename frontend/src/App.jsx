import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CanvasProvider } from './contexts/CanvasContext';
import { useAuth } from './hooks/useAuth';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import Navbar from './components/Layout/Navbar';
import Canvas from './components/Canvas/Canvas';
import CanvasControls from './components/Canvas/CanvasControls';

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
  return (
    <CanvasProvider>
      <div className="h-screen flex flex-col overflow-hidden">
        <Navbar />
        <div className="flex-1 relative">
          <CanvasControls />
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
        path="/canvas"
        element={
          <ProtectedRoute>
            <CanvasPage />
          </ProtectedRoute>
        }
      />
      
      {/* Default Route - Redirect to login if not authenticated, canvas if authenticated */}
      <Route path="/" element={<HomeRedirect />} />
      
      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// Home Redirect Component
function HomeRedirect() {
  const { currentUser } = useAuth();
  return <Navigate to={currentUser ? '/canvas' : '/login'} replace />;
}

// Root App with Providers
function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
