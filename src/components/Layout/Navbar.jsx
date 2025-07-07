import React, { useState } from 'react';
import { Bell, User, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import NotificationDropdown from './NotificationDropdown';
import logo from '../../logo.png';

const Navbar = ({ onMenuToggle, isMobileMenuOpen }) => {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  return (
    <nav className="bg-background shadow-lg border-b border-background sticky top-0 z-50 text-onPrimary">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Logo and Menu */}
          <div className="flex items-center space-x-4">
            <button
              onClick={onMenuToggle}
              className="lg:hidden p-2 rounded-md text-onPrimary hover:text-primary hover:bg-background transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
            
            <div className="flex items-center space-x-3">
              <img src={logo} alt="Sakthi Spark Logo" className="w-16 h-16 rounded-2xl object-contain" />
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-onPrimary">Sakthi Spark</h1>
                <p className="text-xs text-primary">Admin & Reviewer Dashboard</p>
              </div>
            </div>
          </div>

          {/* Right side - Notifications and User */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg text-onPrimary hover:text-primary hover:bg-background transition-colors"
              >
                <Bell className="h-6 w-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-onPrimary text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <NotificationDropdown onClose={() => setShowNotifications(false)} />
              )}
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 p-2 rounded-lg text-onPrimary hover:text-primary hover:bg-background transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-primary to-tertiary rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-onPrimary" />
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-onPrimary">{user?.name}</p>
                  <p className="text-xs text-primary capitalize">{user?.role}</p>
                </div>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-background rounded-lg shadow-lg border border-background py-1 z-50">
                  <div className="px-4 py-2 border-b border-background">
                    <p className="text-sm font-medium text-onPrimary">{user?.name}</p>
                    <p className="text-xs text-primary">{user?.email}</p>
                    <span className="inline-block mt-1 px-2 py-1 text-xs bg-primary text-onPrimary rounded-full capitalize">
                      {user?.role}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-onPrimary hover:bg-background transition-colors"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;