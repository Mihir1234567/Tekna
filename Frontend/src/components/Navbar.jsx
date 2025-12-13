// src/components/Navbar.jsx
import { NavLink, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  FileText,
  Layers,
  Archive,
  List,
} from "lucide-react";
import { useState } from "react";
import { logout } from "../utils/auth";

const navLinks = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Configurator", path: "/configurator", icon: Layers },
  { label: "Material Config", path: "/material-config", icon: Archive },
  { label: "Material Quotes", path: "/material-quotes", icon: List },
  { label: "Quotes", path: "/quotes", icon: FileText },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* --- Logo Section --- */}
          <div
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              T
            </div>
            <span className="text-xl font-bold text-slate-800 tracking-tight">
              TEKNA
            </span>
          </div>

          {/* --- Desktop Navigation --- */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${
                    isActive
                      ? "bg-blue-50 text-blue-600"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* --- Right Side Actions --- */}
          <div className="hidden md:flex items-center gap-4">
            <div className="h-8 w-px bg-slate-200 mx-2"></div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-slate-500 hover:text-red-600 transition-colors text-sm font-medium"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>

          {/* --- Mobile Menu Button --- */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-md text-slate-600 hover:bg-slate-100 transition-colors"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* --- Mobile Menu Dropdown --- */}
      {isOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white absolute w-full shadow-lg">
          <div className="px-4 pt-2 pb-4 space-y-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium transition-colors
                  ${
                    isActive
                      ? "bg-blue-50 text-blue-600"
                      : "text-slate-600 hover:bg-slate-50"
                  }`
                }
              >
                <link.icon size={20} />
                {link.label}
              </NavLink>
            ))}

            <div className="h-px bg-slate-100 my-2"></div>

            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-3 py-3 rounded-lg text-base font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut size={20} />
              Logout
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
