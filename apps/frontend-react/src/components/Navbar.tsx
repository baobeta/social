import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/types/auth';

function LogoAndName() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
          </svg>
        </div>
      </div>
      <span className="text-xl font-bold text-gray-800">Social</span>
    </div>
  );
}

function NavBarActions({ handleLogout }: { handleLogout: () => void }) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => navigate('/profile')}
        className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-green-600 transition-colors"
      > Profile </button>
      <button onClick={handleLogout} className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-red-600 transition-colors">Logout</button>
    </div>
  );
}
function UserRoleBadge({ role }: { role: string }) {
  return (
    <div className="text-sm flex items-center gap-1 font-semibold bg-green-300  px-2 py-1 rounded-full w-fit">
      <span className="text-xs text-gray-500">{role === 'admin' ? '👑' : '👤'}</span>
      <span className="text-xs text-gray-500">{role === 'admin' ? 'Admin' : 'User'}</span>
    </div>
  );
}

function UserProfile({ user, getInitials }: { user: User, getInitials: (name: string) => string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-semibold">
        {getInitials(user.fullName)}
      </div>
      <div>
        <div className="text-left">
          <div className="text-sm font-semibold text-gray-800">{user.fullName}</div>
          <div className="flex items-center gap-1"><UserRoleBadge role={user.role} /> <div className="text-xs text-gray-500">@{user.username}</div></div>
        </div>
      </div>
    </div>
  );
}


export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout, getInitials } = useAuth();

  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  if (!user) return null;

  return (
    <nav className="bg-white/80 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-50 shadow-md">
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
        <LogoAndName />

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <UserProfile user={user} getInitials={getInitials} />
              <NavBarActions handleLogout={handleLogout} />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

