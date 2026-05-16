import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Leaf, LayoutDashboard, PackageSearch, ScanBarcode, LogOut } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navLinks = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Inventory', path: '/inventory', icon: PackageSearch },
    { name: 'Scanner', path: '/scanner', icon: ScanBarcode },
  ];

  return (
    <nav className="bg-white border-b border-slate-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <Leaf className="w-6 h-6 text-[var(--color-primary)]" />
              <span className="font-bold text-lg text-slate-800 tracking-tight">EcoTrack</span>
            </Link>
            
            <div className="hidden md:flex md:ml-10 md:space-x-4">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors duration-200",
                      isActive 
                        ? "bg-[var(--color-primary-light)]/10 text-[var(--color-primary-dark)]" 
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {link.name}
                  </Link>
                );
              })}
            </div>
          </div>
          
          <div className="flex items-center">
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-red-500 transition-colors px-3 py-2 rounded-xl hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:block">Logout</span>
            </button>
          </div>
        </div>
      </div>
      {/* Mobile nav (bottom bar ideally, but sticking to simple for now) */}
      <div className="md:hidden border-t border-slate-100 py-2 px-4 flex justify-around">
         {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-xl text-xs font-medium transition-colors duration-200",
                  isActive 
                    ? "text-[var(--color-primary-dark)]" 
                    : "text-slate-500 hover:text-slate-900"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive && "text-[var(--color-primary)]")} />
                {link.name}
              </Link>
            );
          })}
      </div>
    </nav>
  );
};

export default Navbar;
