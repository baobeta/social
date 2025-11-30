interface LandingNavbarProps {
  activeUsers: number;
  isAuthenticated: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
}

export default function LandingNavbar({
  activeUsers,
  isAuthenticated,
  onSignIn,
  onSignOut,
}: LandingNavbarProps) {
  return (
    <nav className="relative z-10 flex items-center justify-between px-8 py-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
          </svg>
        </div>
        <span className="text-xl font-bold text-gray-800">Social</span>
      </div>

      <div className="flex items-center gap-6">
        <span className="text-sm text-gray-600 flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          {activeUsers.toLocaleString()} online
        </span>

        {!isAuthenticated ? (
          <button
            onClick={onSignIn}
            className="px-6 py-2 bg-white border-2 border-green-500 text-green-700 rounded-full hover:bg-green-50 transition-colors"
          >
            Sign In
          </button>
        ) : (
          <button
            onClick={onSignOut}
            className="px-6 py-2 bg-gray-100 border-2 border-gray-300 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
          >
            Sign Out
          </button>
        )}
      </div>
    </nav>
  );
}

