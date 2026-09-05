import { Link, NavLink, useNavigate } from "react-router-dom";
import { Building2 } from "lucide-react";
import useAuth from "../hooks/useAuth";
import showToast from "../utils/showToast";
import { useState } from "react";

function Sidebar({ user: propUser }) {
  const [openSidebar, setOpenSidebar] = useState(false);
  const { logoutUser, user: authUser } = useAuth();
  const user = propUser || authUser;
  const navigate = useNavigate();

  function handleLogout() {
    setOpenSidebar(false);
    logoutUser();
    navigate("/login");
    showToast("success", "Successfully logged out");
  }

  function handleNav() {
    setOpenSidebar((prev) => !prev);
  }

  const closeMobileSidebar = () => setOpenSidebar(false);

  return (
    <>
      <button
        onClick={handleNav}
        data-drawer-target="default-sidebar"
        data-drawer-toggle="default-sidebar"
        aria-controls="default-sidebar"
        type="button"
        className={`cursor-pointer fixed top-4 z-50 inline-flex rounded-sm border border-brand-accent/10 bg-white p-2 text-sm leading-5 text-brand-accent shadow-[0_18px_40px_-30px_rgba(10,37,37,0.4)] transition-colors focus:outline-none focus:ring-4 focus:ring-brand-accent/10 sm:hidden ${openSidebar ? "right-4" : "left-4"}`}>
        <span className="sr-only">Open sidebar</span>
        <svg
          className="w-6 h-6"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          fill="none"
          viewBox="0 0 24 24">
          {openSidebar ? (
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="2"
              d="M5 7h14M5 12h14M5 17h10"
            />
          )}
        </svg>
      </button>

      {openSidebar && (
        <div
          className="fixed inset-0 bg-black/40 z-30 sm:hidden"
          onClick={() => setOpenSidebar(false)}
        />
      )}

      <aside
        id="default-sidebar"
        className={`fixed top-0 left-0 z-40 h-[100dvh] w-72 transition-transform bg-stone-900 sm:translate-x-0 ${
          openSidebar ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Sidebar">
        <div className="flex h-full min-h-0 flex-col overflow-y-auto border-r border-brand-accent/10 py-4">
          <Link
            to="/app"
            onClick={() => setOpenSidebar(false)}
            className="flex items-center ps-5.5 mt-2 pb-4 mb-5 border-b border-b-brand-accent/10">
            <img
              src="/logo-white.svg"
              className="h-7 me-3"
              alt="bin around the bloc' Logo"
            />
          </Link>
          <ul className="flex min-h-0 flex-1 flex-col px-3 text-white">
            <div className="space-y-3">
              <li>
                <NavLink
                  to="/app"
                  end
                  onClick={closeMobileSidebar}
                  className={({ isActive }) =>
                    `flex items-center px-2 py-1.5 rounded-sm hover:text-white duration-300 transition ease-in-out ${isActive ? "text-white hover:text-white" : "text-white/70"}`
                  }>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="shrink-0 w-5 h-5 transition duration-75 lucide lucide-layout-dashboard">
                    <rect width="7" height="9" x="3" y="3" rx="1" />
                    <rect width="7" height="5" x="14" y="3" rx="1" />
                    <rect width="7" height="9" x="14" y="12" rx="1" />
                    <rect width="7" height="5" x="3" y="16" rx="1" />
                  </svg>
                  <span className="ms-3">Dashboard</span>
                </NavLink>
              </li>

              <li>
                <NavLink
                  to="/app/payment"
                  onClick={closeMobileSidebar}
                  className={({ isActive }) =>
                    `flex items-center px-2 py-1.5 rounded-sm hover:text-white duration-300 transition ease-in-out ${isActive ? "text-white hover:text-white" : "text-white/70"}`
                  }>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-hand-coins-icon lucide-hand-coins">
                    <path d="M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 17" />
                    <path d="m7 21 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9" />
                    <path d="m2 16 6 6" />
                    <circle cx="16" cy="9" r="2.9" />
                    <circle cx="6" cy="5" r="3" />
                  </svg>
                  <span className="flex-1 ms-3 whitespace-nowrap">
                    Make Payment
                  </span>
                </NavLink>
              </li>

              <li>
                <NavLink
                  to="/app/history"
                  onClick={closeMobileSidebar}
                  className={({ isActive }) =>
                    `flex items-center px-2 py-1.5 rounded-sm hover:text-white duration-300 transition ease-in-out ${
                      isActive ? "text-white hover:text-white" : "text-white/70"
                    }`
                  }>
                  {({ isActive }) => (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="shrink-0 w-5 h-5 transition duration-75 lucide lucide-file-stack">
                        <path d="M11 21a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1" />
                        <path d="M16 16a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1" />
                        <path d="M21 6a2 2 0 0 0-.586-1.414l-2-2A2 2 0 0 0 17 2h-3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1z" />
                      </svg>

                      <span className="flex-1 ms-3 whitespace-nowrap">
                        Payment History
                      </span>

                      <span
                        className={`bg-brand-secondary border border-stone-900 text-xs font-medium px-1.5 py-0.5 rounded-sm ${
                          isActive ? "text-white" : "text-brand-accent"
                        }`}>
                        New
                      </span>
                    </>
                  )}
                </NavLink>
              </li>

              <li>
                <NavLink
                  to="/app/receipts"
                  onClick={closeMobileSidebar}
                  className={({ isActive }) =>
                    `flex items-center px-2 py-1.5 rounded-sm hover:text-white duration-300 transition ease-in-out ${isActive ? "text-white hover:text-white" : "text-white/70"}`
                  }>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-receipt-text-icon lucide-receipt-text">
                    <path d="M13 16H8" />
                    <path d="M14 8H8" />
                    <path d="M16 12H8" />
                    <path d="M4 3a1 1 0 0 1 1-1 1.3 1.3 0 0 1 .7.2l.933.6a1.3 1.3 0 0 0 1.4 0l.934-.6a1.3 1.3 0 0 1 1.4 0l.933.6a1.3 1.3 0 0 0 1.4 0l.933-.6a1.3 1.3 0 0 1 1.4 0l.934.6a1.3 1.3 0 0 0 1.4 0l.933-.6A1.3 1.3 0 0 1 19 2a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1 1.3 1.3 0 0 1-.7-.2l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.934.6a1.3 1.3 0 0 1-1.4 0l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-1.4 0l.934-.6a1.3 1.3 0 0 0 1.4 0l.933.6a1.3 1.3 0 0 1-.7.2 1 1 0 0 1-1-1z" />
                  </svg>
                  <span className="flex-1 ms-3 whitespace-nowrap">
                    Receipts
                  </span>
                </NavLink>
              </li>

              <li>
                <NavLink
                  to="/app/support"
                  onClick={closeMobileSidebar}
                  className={({ isActive }) =>
                    `flex items-center px-2 py-1.5 rounded-sm hover:text-white duration-300 transition ease-in-out ${isActive ? "text-white hover:text-white" : "text-white/70"}`
                  }>
                  <svg
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="shrink-0 w-5 h-5 transition duration-75 lucide lucide-headset">
                    <path d="M3 11h3a2 2 0 0 1-2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5Zm0 0a9 9 0 1 1 18 0m0 0v5a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3Z" />
                    <path d="M21 16v2a4 4 0 0 1-4 4h-5" />
                  </svg>
                  <span className="flex-1 ms-3 whitespace-nowrap">Support</span>
                </NavLink>
              </li>
            </div>

            <div className="mt-auto space-y-3 pb-2">
              {(user?.estate?.name || user?.estate_id) && (
                <div className="mx-1 rounded-sm border border-white/10 bg-white/5 p-3 text-xs text-white/80">
                  <div className="flex items-center gap-1.5 font-medium text-white">
                    <Building2 size={14} className="shrink-0 text-brand-secondary" />
                    <span className="truncate">{user?.estate?.name || "Verified Estate"}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-white/50 truncate">
                    {[user?.housenumber ? `House ${user.housenumber}` : "", user?.streetname]
                      .filter(Boolean)
                      .join(", ") || "Assigned Property"}
                  </p>
                  <div className="mt-2 inline-flex items-center rounded-xs bg-white/10 px-2 py-0.5 text-[10px] font-medium text-brand-secondary">
                    {user?.property_type_name || "Residential"}
                  </div>
                </div>
              )}
              <li>
                <NavLink
                  to="/app/settings"
                  onClick={closeMobileSidebar}
                  className={({ isActive }) =>
                    `flex items-center px-2 py-1.5 rounded-sm hover:text-white duration-300 transition ease-in-out ${isActive ? "text-white hover:text-white" : "text-white/70"}`
                  }>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="shrink-0 w-5 h-5 transition duration-75 lucide lucide-settings">
                    <path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  <span className="flex-1 ms-3 whitespace-nowrap">
                    Settings
                  </span>
                </NavLink>
              </li>

              <li
                onClick={handleLogout}
                className="text-status-error flex items-center px-2 py-1.5 rounded-sm hover:bg-status-error/10 hover:text-status-error cursor-pointer">
                <svg
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="none"
                  viewBox="0 0 24 24"
                  className="shrink-0 w-5 h-5 transition duration-75">
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 12H4m12 0-4 4m4-4-4-4m3-4h2a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3h-2"
                  />
                </svg>

                <span className="flex-1 ms-3 whitespace-nowrap">Log out</span>
              </li>
            </div>
          </ul>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
