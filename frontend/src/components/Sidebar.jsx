import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, PackageSearch, ScanBarcode, ChefHat, AlertTriangle, X, LogOut } from 'lucide-react';
import { cn } from './Navbar';

const Sidebar = ({ isOpen, onClose, handleLogout }) => {
  const location = useLocation();

  const navLinks = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Fridge', path: '/inventory', icon: PackageSearch },
    { name: 'Expired Items', path: '/expired', icon: AlertTriangle },
    { name: 'Recipes', path: '/recipes', icon: ChefHat },
    { name: 'Scanner', path: '/scanner', icon: ScanBarcode },
  ];

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={onClose}
        ></div>
      )}

      {/* Sidebar Panel */}
      <div 
        className={cn(
          "fixed lg:relative inset-y-0 left-0 z-50 bg-white border-slate-100 shadow-2xl lg:shadow-none transition-all duration-300 ease-in-out flex flex-col overflow-hidden h-full",
          isOpen ? "translate-x-0 w-72 border-r" : "-translate-x-full lg:translate-x-0 lg:w-0 border-transparent"
        )}
      >
        <div className="w-72 flex flex-col h-full min-w-[18rem]">
          <div className="flex items-center justify-between p-6 border-b border-slate-50">
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">EcoTrack</h2>
            <button 
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-3">Menu</div>
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => {
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3.5 rounded-2xl text-sm font-medium transition-all duration-300 group relative",
                    isActive 
                      ? "bg-gradient-to-r from-[var(--color-primary-light)]/20 to-transparent text-[var(--color-primary-dark)]" 
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[var(--color-primary)] rounded-r-full"></div>
                  )}
                  <Icon className={cn("w-5 h-5", isActive ? "text-[var(--color-primary)]" : "text-slate-400 group-hover:text-slate-600 transition-colors")} />
                  {link.name}
                </Link>
              );
            })}
          </div>

          <div className="p-4 border-t border-slate-50">
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-3.5 text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all duration-200 group"
            >
              <LogOut className="w-5 h-5 text-slate-400 group-hover:text-red-500 transition-colors" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
