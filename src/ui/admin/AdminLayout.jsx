import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import ProfileChip from "../ProfileChip";
import useAuth from "../../hooks/useAuth";
import showToast from "../../utils/showToast";
import { Copy, Check } from "lucide-react";
import { useState } from "react";

function AdminLayout() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

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
      <AdminSidebar />

      <div className="p-4 sm:ml-74 min-h-screen bg-stone-50/50">
        {/* Top Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-brand-accent/10 pb-4 mb-6 bg-white p-4 rounded-sm">
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

        {/* Content Outlet */}
        <div className="mt-2">
          <Outlet />
        </div>
      </div>
    </>
  );
}

export default AdminLayout;
