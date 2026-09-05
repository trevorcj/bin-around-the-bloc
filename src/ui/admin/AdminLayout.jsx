import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import ProfileChip from "../ProfileChip";
import useAuth from "../../hooks/useAuth";
import showToast from "../../utils/showToast";
import { Copy, Check, Menu } from "lucide-react";
import { useState } from "react";

function AdminLayout() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const estateCode = user?.estate?.code || "";

  async function handleCopyCode() {
    if (!estateCode) return;
    try {
      await navigator.clipboard.writeText(estateCode);
      setCopied(true);
      showToast("success", "Estate code copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast("error", "Unable to copy code.");
    }
  }

  return (
    <>
      <AdminSidebar openSidebar={sidebarOpen} setOpenSidebar={setSidebarOpen} />

      <div className="sm:ml-74 min-h-screen bg-stone-50/50 flex flex-col">
        <div className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-brand-accent/10 bg-white px-4 py-3 sm:hidden shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
              className="p-1.5 -ml-1 text-brand-accent hover:bg-brand-accent/5 rounded-sm cursor-pointer transition-colors shrink-0">
              <Menu size={22} />
            </button>
            <div className="min-w-0">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-accent/50 block leading-tight">
                Estate Admin
              </span>
              <h2 className="text-sm font-semibold text-brand-accent truncate">
                {user?.estate?.name || "Estate Dashboard"}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {estateCode && (
              <button
                type="button"
                onClick={handleCopyCode}
                title="Copy Estate Code"
                className="flex items-center gap-1.5 bg-brand-accent/5 border border-brand-accent/10 px-2 py-1 rounded-sm text-brand-accent hover:bg-brand-accent/10 transition-colors cursor-pointer text-xs">
                <span className="font-mono font-semibold">{estateCode}</span>
                {copied ? (
                  <Check size={13} className="text-status-success" />
                ) : (
                  <Copy size={13} className="text-brand-accent/60" />
                )}
              </button>
            )}
            <ProfileChip user={user} />
          </div>
        </div>

        <div className="p-4 sm:p-6 flex-1">
          <div className="hidden sm:flex flex-wrap items-center justify-between gap-4 border-b border-brand-accent/10 pb-4 mb-6 bg-white p-4 rounded-sm">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-accent/50 block">
                Estate Administration
              </span>
              <h2 className="text-lg font-semibold text-brand-accent">
                {user?.estate?.name || "Estate Dashboard"}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              {estateCode && (
                <div className="flex items-center gap-2 bg-brand-accent/5 border border-brand-accent/10 px-3 py-1.5 rounded-sm">
                  <span className="text-xs font-medium text-brand-accent/60">
                    Estate Code:
                  </span>
                  <span className="font-mono font-semibold text-sm text-brand-accent tracking-wider">
                    {estateCode}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    title="Copy Estate Code"
                    className="p-1 rounded text-brand-accent/60 hover:text-brand-accent hover:bg-brand-accent/10 transition-colors cursor-pointer">
                    {copied ? (
                      <Check size={16} className="text-status-success" />
                    ) : (
                      <Copy size={16} />
                    )}
                  </button>
                </div>
              )}

              <ProfileChip user={user} />
            </div>
          </div>

          <div>
            <Outlet />
          </div>
        </div>
      </div>
    </>
  );
}

export default AdminLayout;
