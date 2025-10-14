// Navbar Component - Displays user info, logout button, and branding

import { useAuth } from '../../hooks/useAuth';
import PresenceList from '../Collaboration/PresenceList';

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };
  
  // Get display name or email prefix
  const displayName = currentUser?.displayName || 
                      currentUser?.email?.split('@')[0] || 
                      'User';
  
  // Truncate if too long
  const truncatedName = displayName.length > 20 
    ? displayName.substring(0, 20) + '...' 
    : displayName;
  
  return (
    <nav className="bg-white shadow-md border-b border-gray-200">
      {/* Using px-4 to align with Canvas Controls left-4 positioning */}
      <div className="px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Title - Aligned with Canvas Controls */}
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-blue-600">CollabCanvas</h1>
          </div>
          
          {/* User Info and Logout - Aligned with Canvas Info overlay */}
          {currentUser && (
            <div className="flex items-center space-x-4">
              {/* Presence List - Online Users */}
              <PresenceList />
              
              {/* Divider */}
              <div className="h-8 w-px bg-gray-300"></div>
              
              {/* User Avatar and Name */}
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-900">{truncatedName}</p>
                  <p className="text-xs text-gray-500">{currentUser.email}</p>
                </div>
              </div>
              
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition duration-200"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

