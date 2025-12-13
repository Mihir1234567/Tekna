// src/components/Sidebar.jsx
import { NavLink, useNavigate } from "react-router-dom";
import { Home, Layers, FileText, LogOut, Archive, List } from "lucide-react";
import { logout } from "../utils/auth";

const menu = [
  { name: "Dashboard", path: "/dashboard", icon: <Home size={20} /> },
  { name: "Configurator", path: "/configurator", icon: <Layers size={20} /> },
  {
    name: "Material Config",
    path: "/material-config",
    icon: <Archive size={20} />,
  },
  {
    name: "Material Quotes",
    path: "/material-quotes",
    icon: <List size={20} />,
  },
  { name: "Quotations", path: "/quotes", icon: <FileText size={20} /> },
];

export default function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className="w-64 h-screen bg-white border-r border-slate-200 flex flex-col sticky top-0">
      {/* --- Header / Logo --- */}
      <div className="h-16 flex items-center px-6 border-b border-slate-100">
        <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg mr-3">
          T
        </div>
        <span className="text-xl font-bold text-slate-800 tracking-tight">
          TeknaGlass
        </span>
      </div>

      {/* --- Navigation Links --- */}
      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
        <div className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Menu
        </div>
        {menu.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group
              ${
                isActive
                  ? "bg-blue-50 text-blue-600"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`
            }
          >
            <span className="opacity-75 group-hover:opacity-100">
              {item.icon}
            </span>
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* --- Footer / User Profile --- */}
      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center justify-between gap-3 p-2 rounded-lg bg-slate-50 border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
              U
            </div>
            <div className="text-xs">
              <p className="font-medium text-slate-900">User Account</p>
              <p className="text-slate-500">Admin</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-slate-400 hover:text-red-600 transition-colors p-1"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
