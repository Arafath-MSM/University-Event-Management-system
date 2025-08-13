import React, { useState, useEffect } from "react";
import { Bell, User, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import apiService from "@/services/api";
import NotificationPopup from "./NotificationPopup";

interface DashboardNavbarProps {
  roleLabel?: string;
  showFullNavbar?: boolean;
}

const roleDisplay: Record<string, string> = {
  "vice-chancellor": "Vice Chancellor",
  administration: "Administration UWU",
  "student-union": "Student Union",
  warden: "Warden",
  student: "Student",
  faculty: "Faculty",
  admin: "Admin",
  "service-provider": "Service Provider",
};

export const DashboardNavbar: React.FC<DashboardNavbarProps> = ({
  roleLabel,
  showFullNavbar = true,
}) => {
  const { user, logout } = useAuth();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [isNotificationPopupOpen, setIsNotificationPopupOpen] = useState(false);
  const navigate = useNavigate();
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "U";
  const role =
    roleLabel || (user?.role ? roleDisplay[user.role] || user.role : "User");

  // Fetch unread notification count
  useEffect(() => {
    const fetchNotificationCount = async () => {
      if (!user) return;
      
      setIsLoadingNotifications(true);
      try {
        const response = await apiService.getNotifications({
          status: 'unread'
        });
        
        if (response.success) {
          const count = response.data?.length || 0;
          console.log('Setting notification count:', count);
          setNotificationCount(count);
        }
      } catch (error) {
        console.error('Error fetching notification count:', error);
      } finally {
        setIsLoadingNotifications(false);
      }
    };

    fetchNotificationCount();
    
    // Refresh notification count every 30 seconds
    const interval = setInterval(fetchNotificationCount, 30000);
    
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleNotificationClick = () => {
    setIsNotificationPopupOpen(true);
  };

  const handleNotificationPopupClose = () => {
    setIsNotificationPopupOpen(false);
    // Refresh notification count when popup is closed
    const fetchNotificationCount = async () => {
      if (!user) return;
      
      try {
        const response = await apiService.getNotifications({
          status: 'unread'
        });
        
        if (response.success) {
          setNotificationCount(response.data?.length || 0);
        }
      } catch (error) {
        console.error('Error fetching notification count:', error);
      }
    };
    
    fetchNotificationCount();
  };

  return (
    <>
      {showFullNavbar ? (
        <nav className="border-b border-gray-200 px-4 py-4 flex items-center justify-between w-full" style={{ backgroundColor: '#4d0011' }}>
          <div className="flex items-center">
            <img src="/Logo UWU.png" alt="Eventra Logo" className="h-8 w-auto mr-2" />
            <span className="text-2xl font-bold text-blue-600">Eventra</span>
          </div>
          <div className="flex items-center gap-8">
            {/* Notification bell */}
            <div className="relative">
              <button
                onClick={handleNotificationClick}
                className="focus:outline-none relative"
                disabled={isLoadingNotifications}
              >
                <Bell className="text-white hover:text-gray-200 transition-colors" size={26} />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-bold shadow-lg z-10">
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </span>
                )}
                {isLoadingNotifications && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                )}
              </button>
            </div>
            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileDropdownOpen((open) => !open)}
                className="flex items-center space-x-3 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              >
                <span className="bg-blue-500 text-white font-bold rounded-full w-9 h-9 flex items-center justify-center text-base">
                  {initials}
                </span>
                <div className="hidden sm:block text-left">
                  <span className="font-semibold text-gray-900 leading-tight">
                    {user?.name || "User"}
                  </span>
                  <span className="block text-xs text-gray-500 leading-tight">{role}</span>
                </div>
              </button>
              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <Link
                    to="/profile"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsProfileDropdownOpen(false)}
                  >
                    <User size={16} className="mr-3" />
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <LogOut size={16} className="mr-3" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </nav>
      ) : (
        <div className="flex items-center gap-4">
          {/* Notification bell */}
          <div className="relative">
            <button
              onClick={handleNotificationClick}
              className="focus:outline-none relative p-2 text-white hover:text-gray-300 transition-colors"
              disabled={isLoadingNotifications}
            >
              <Bell size={20} />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-bold shadow-lg z-10">
                  {notificationCount > 99 ? '99+' : notificationCount}
                </span>
              )}
              {isLoadingNotifications && (
                <div className="absolute -top-1 -right-1 w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              )}
            </button>
          </div>
          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsProfileDropdownOpen((open) => !open)}
              className="flex items-center space-x-3 p-2 text-white hover:text-blue-200 hover:bg-black rounded-lg"
            >
              <div className="bg-white text-black w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium">
                {initials}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-sm font-medium text-white">{user?.name}</div>
                <div className="text-xs text-white capitalize">{user?.role}</div>
              </div>
            </button>
            {isProfileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-900/90 rounded-lg shadow-lg border border-gray-700 py-1 z-50">
                <Link
                  to="/profile"
                  className="flex items-center px-4 py-2 text-sm text-white hover:bg-gray-800"
                  onClick={() => setIsProfileDropdownOpen(false)}
                >
                  <User size={16} className="mr-3" />
                  Profile
                </Link>
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
        </div>
      )}
      
      {/* Notification Popup */}
      <NotificationPopup 
        isOpen={isNotificationPopupOpen} 
        onClose={handleNotificationPopupClose} 
      />
    </>
  );
};

export default DashboardNavbar;







    