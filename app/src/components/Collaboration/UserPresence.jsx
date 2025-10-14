// UserPresence Component - Display a single user's presence badge

export default function UserPresence({ displayName, color, isCurrentUser = false }) {
  // Get initials from display name
  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };
  
  const initials = getInitials(displayName);
  
  return (
    <div
      className="relative group"
      title={`${displayName}${isCurrentUser ? ' (You)' : ''}`}
    >
      {/* Avatar circle with user color */}
      <div
        className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-white shadow-sm text-xs font-bold text-white transition-transform hover:scale-110 hover:z-10"
        style={{ backgroundColor: color }}
      >
        {initials}
      </div>
      
      {/* Tooltip on hover */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
        {displayName}
        {isCurrentUser && ' (You)'}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
      </div>
    </div>
  );
}

