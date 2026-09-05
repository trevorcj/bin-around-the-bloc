import { Link, NavLink, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import showToast from "../../utils/showToast";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Settings,
  LogOut,
  X,
} from "lucide-react";

function AdminSidebar({ openSidebar = false, setOpenSidebar }) {
  const { logoutUser, user } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    if (setOpenSidebar) setOpenSidebar(false);
    logoutUser();
    navigate("/login");
    showToast("success", "Successfully logged out");
  }

  const closeMobileSidebar = () => {
    if (setOpenSidebar) setOpenSidebar(false);
  };

  return (
    <>
      {openSidebar && (
        <div
          className="fixed inset-0 bg-black/40 z-40 sm:hidden"
          onClick={closeMobileSidebar}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-[100dvh] w-72 transition-transform bg-[#0a2525] sm:translate-x-0 ${
          openSidebar ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Admin Sidebar">
        <div className="flex h-full min-h-0 flex-col overflow-y-auto border-r border-white/10 py-4">
          <div className="flex items-center justify-between ps-5.5 pe-4 mt-2 pb-4 mb-5 border-b border-white/10">
            <Link
              to="/admin"
              onClick={closeMobileSidebar}
              className="flex items-center">
              <img
                src="/logo-white.svg"
                className="h-7 me-3"
                alt="bin around the bloc' Logo"
              />
              <span className="bg-brand-primary/20 text-brand-primary text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-sm">
                Admin
              </span>
            </Link>

            <button
              type="button"
              onClick={closeMobileSidebar}
              className="sm:hidden p-1.5 rounded-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close sidebar">
              <X size={20} />
            </button>
          </div>

          {user?.estate?.name && (
            <div className="px-5 mb-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
                Current Estate
              </p>
              <p className="text-sm font-medium text-white/90 truncate mt-0.5">
                {user.estate.name}
              </p>
            </div>
          )}

          <ul className="flex min-h-0 flex-1 flex-col px-3 text-white">
            <div className="space-y-2">
              <li>
                <NavLink
                  to="/admin"
                  end
                  onClick={closeMobileSidebar}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 rounded-sm text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-white/10 text-white font-semibold"
                        : "text-white/70 hover:bg-white/5 hover:text-white"
                    }`
                  }>
                  <LayoutDashboard className="shrink-0 w-5 h-5 me-3" />
                  <span>Overview</span>
                </NavLink>
              </li>

              <li>
                <NavLink
                  to="/admin/residents"
                  onClick={closeMobileSidebar}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 rounded-sm text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-white/10 text-white font-semibold"
                        : "text-white/70 hover:bg-white/5 hover:text-white"
                    }`
                  }>
                  <Users className="shrink-0 w-5 h-5 me-3" />
                  <span>Residents</span>
                </NavLink>
              </li>

              <li>
                <NavLink
                  to="/admin/payments"
                  onClick={closeMobileSidebar}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 rounded-sm text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-white/10 text-white font-semibold"
                        : "text-white/70 hover:bg-white/5 hover:text-white"
                    }`
                  }>
                  <CreditCard className="shrink-0 w-5 h-5 me-3" />
                  <span>Payments</span>
                </NavLink>
              </li>

              <li>
                <NavLink
                  to="/admin/settings"
                  onClick={closeMobileSidebar}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 rounded-sm text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-white/10 text-white font-semibold"
                        : "text-white/70 hover:bg-white/5 hover:text-white"
                    }`
                  }>
                  <Settings className="shrink-0 w-5 h-5 me-3" />
                  <span>Settings</span>
                </NavLink>
              </li>
            </div>

            <div className="mt-auto space-y-2 pb-2">
              <li
                onClick={handleLogout}
                className="text-status-error flex items-center px-3 py-2 rounded-sm hover:bg-status-error/10 hover:text-status-error cursor-pointer text-sm font-medium transition-colors">
                <LogOut className="shrink-0 w-5 h-5 me-3" />
                <span>Log out</span>
              </li>
            </div>
          </ul>
        </div>
      </aside>
    </>
  );
}

export default AdminSidebar;
