import { NavLink, useNavigate } from "react-router-dom";
import { X, LogOut } from "lucide-react";

export default function MobileSidebar({ open, setOpen, navLinks }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("auth");
    navigate("/login");
    setOpen(false);
  };

  return (
    <div
      className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity ${
        open
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
      onClick={() => setOpen(false)}
    >
      <div
        className={`bg-white h-full w-64 p-5 shadow-xl transform transition-transform ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <span className="text-xl font-semibold text-blue-600">ALUGLASS</span>
          <button onClick={() => setOpen(false)}>
            <X size={22} className="text-gray-700" />
          </button>
        </div>

        {/* Menu */}
        <nav className="flex flex-col gap-4 mt-4">
          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-lg font-medium ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-gray-700 hover:bg-gray-100"
                }`
              }
              onClick={() => setOpen(false)}
            >
              {link.label}
            </NavLink>
          ))}

          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 mt-4 text-red-600 font-medium rounded-lg hover:bg-red-50"
          >
            <LogOut size={18} />
            Logout
          </button>
        </nav>
      </div>
    </div>
  );
}
