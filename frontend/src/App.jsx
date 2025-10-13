import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import Navbar from './components/Layout/Navbar';

// Protected Route Component
function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

// Canvas Page Placeholder (will be implemented in PR #3)
function CanvasPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Canvas Workspace</h2>
          <p className="text-gray-600 mb-6">
            The collaborative canvas will be implemented in PR #3
          </p>
          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 text-left max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">✅ PR #2 Complete!</h3>
            <ul className="space-y-2 text-blue-700">
              <li>✅ User authentication with email/password</li>
              <li>✅ Google OAuth integration</li>
              <li>✅ Protected routes</li>
              <li>✅ User session management</li>
              <li>✅ Navbar with logout functionality</li>
            </ul>
            <p className="mt-4 text-sm text-blue-600">
              <strong>Next:</strong> PR #3 will add pan/zoom canvas (5000x5000px)
            </p>
          </div>
        </div>
      </div>
    </div>
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
