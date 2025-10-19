// PresenceList Component - Display online users
import { usePresence } from '../../hooks/usePresence';
import UserPresence from './UserPresence';
import { useAuth } from '../../hooks/useAuth';

export default function PresenceList({ canvasId }) {
  const { onlineUsers } = usePresence(canvasId);
  const { currentUser } = useAuth();
  
  // Filter out current user and get count
  const otherUsers = onlineUsers.filter(user => user.userId !== currentUser?.uid);
  const totalUsers = onlineUsers.length;
  
  return (
    <div className="flex items-center gap-2">
      {/* User count badge */}
      <div className="text-sm text-gray-600 font-medium">
        {totalUsers} {totalUsers === 1 ? 'user' : 'users'} online
      </div>
      
      {/* Online users list */}
      <div className="flex items-center -space-x-2">
        {onlineUsers.slice(0, 5).map((user) => (
          <UserPresence
            key={user.userId}
            displayName={user.displayName}
            color={user.cursorColor}
            isCurrentUser={user.userId === currentUser?.uid}
          />
        ))}
        
        {/* Show "+N more" if there are more than 5 users */}
        {totalUsers > 5 && (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 border-2 border-white text-xs font-medium text-gray-600">
            +{totalUsers - 5}
          </div>
        )}
      </div>
    </div>
  );
}

