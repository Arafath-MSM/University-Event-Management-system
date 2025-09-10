
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Bell, User, Settings, LogOut, Menu, X } from 'lucide-react';
import { DashboardNavbar } from './DashboardNavbar';

interface LayoutProps {
  children: React.ReactNode;
  notificationBell?: React.ReactNode;
  showSidebar?: boolean;
  backgroundImage?: string; // add this
}

const Layout: React.FC<LayoutProps> = ({ children, notificationBell, showSidebar, backgroundImage }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavigationItems = () => {
    if (user?.role === 'super-admin') {
      return [
        { name: 'Dashboard', path: '/admin/dashboard', icon: '📊' },
        { name: 'Admin Tools', path: '/admin/tools', icon: '🔧' },
        { name: 'Venues', path: '/venues', icon: '🏛️' },
        { name: 'Reports', path: '/admin/reports', icon: '📈' },
      ];
    } else if (user?.role === 'service-provider') {
      return [
        { name: 'Dashboard', path: '/dashboards/service-provider', icon: '📊' },
      ];
    } else {
      return [
        { name: 'Dashboard', path: '/dashboard', icon: '📊' },
      ];
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <div
      className="fixed inset-0 bg-cover bg-center"
      style={{ backgroundImage: `url('${backgroundImage || "/Party.jpg"}')` }}
    >
      {/* Header - Black like Home page */}
      <header className="sticky top-0 z-50" style={{ backgroundColor: '#4d0011' }}>
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-24">
            {/* Logo and Mobile Menu */}
            <div className="flex items-center">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden p-2 rounded-md text-white hover:text-blue-200 hover:bg-black"
              >
                {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <Link to="/" className="flex items-center">
                <img src="/Logo UWU.png" alt="UWU Logo" className="h-14 w-auto" />
                <div className="text-3xl font-bold ml-10 text-white">Eventra</div>
              </Link>
            </div>

            {/* Right side - Notifications and Profile */}
            <div className="flex items-center space-x-4">
              {/* Full Screen Button */}
              <button
                className="p-2 text-white hover:text-blue-200 hover:bg-black rounded-lg"
                title="Full Screen"
                onClick={() => {
                  if (document.documentElement.requestFullscreen) {
                    document.documentElement.requestFullscreen();
                  }
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9V5.25A1.5 1.5 0 015.25 3.75H9m6 0h3.75a1.5 1.5 0 011.5 1.5V9m0 6v3.75a1.5 1.5 0 01-1.5 1.5H15m-6 0H5.25a1.5 1.5 0 01-1.5-1.5V15" />
                </svg>
              </button>
              {/* Notifications - Use DashboardNavbar for proper notification handling */}
              {notificationBell ? notificationBell : (
                <DashboardNavbar showFullNavbar={false} />
              )}

              {/* Profile Dropdown - Only show when using custom notificationBell */}
              {notificationBell && (
                <div className="relative">
                  <button
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    className="flex items-center space-x-3 p-2 text-white hover:text-blue-200 hover:bg-black rounded-lg"
                  >
                    <div className="bg-white text-black w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium">
                      {user?.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="hidden sm:block text-left">
                      <div className="text-sm font-medium text-white">{user?.name}</div>
                      <div className="text-xs text-white capitalize">{user?.role}</div>
                    </div>
                  </button>

                  {/* Dropdown Menu */}
                  {isProfileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-gray-900/90 rounded-lg shadow-lg border border-gray-700 py-1 z-50">
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-white hover:bg-gray-800"
                      >
                        <LogOut size={16} className="mr-3" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex w-full h-[calc(100vh-6rem)]" style={{ minHeight: '0' }}>
        {/* Conditionally render sidebar only if showSidebar is true */}
        {showSidebar && (
          <aside className="hidden lg:flex flex-col w-64 border-r border-white/10 h-full p-4" style={{ minHeight: '0', backgroundColor: '#ffd9d9' }}>
            <nav className="flex-1 space-y-2">
              {navigationItems.map(item => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center px-4 py-2 rounded-lg text-black hover:bg-white/50 hover:text-blue-900 transition-colors ${location.pathname === item.path ? 'bg-white/50 font-bold' : ''}`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.name}
                </Link>
              ))}
            </nav>
          </aside>
        )}
        {/* Mobile sidebar overlay */}
        {isSidebarOpen && location.pathname !== '/profile' && (
          <div
            className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
        {/* Main content */}
        <main className="flex-1 w-full h-full overflow-y-auto" style={{ minHeight: '0' }}>
          <div className="w-full min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
