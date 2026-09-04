import { Building2, MapPin, ShieldCheck, Tag } from "lucide-react";
import { StyledH1 } from "../styles/CommonStyles";
import DashboardGrid from "../ui/DashboardGrid";
import formatCurrency from "../utils/formatCurrency";

function Dashboard({ user }) {
  const estateName = user?.estate?.name || "Assigned Estate";
  const estateCode = user?.estate?.code || "";
  const propertyType = user?.property_type_name || "Residential";
  const propertyFee = user?.property_fee ?? 5000;
  const addressParts = [
    user?.housenumber ? `House ${user.housenumber}` : "",
    user?.apartment ? `(${user.apartment})` : "",
    user?.streetname || "",
  ].filter(Boolean);
  const fullAddress = addressParts.length > 0 ? addressParts.join(" ") : "Address pending";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <StyledH1>Hello, {user?.fullname || "Resident"} 👋🏽</StyledH1>
          <p className="mt-1 text-sm text-brand-accent/70">
            Welcome to your resident waste management portal.
          </p>
        </div>

        {estateCode && (
          <div className="inline-flex items-center gap-2 self-start rounded-full border border-brand-accent/10 bg-white px-3 py-1.5 text-xs font-semibold text-brand-accent sm:self-auto">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>Estate Code: {estateCode}</span>
          </div>
        )}
      </div>

      <div className="rounded-sm border border-brand-accent/10 bg-white p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm bg-brand-primary/10 text-brand-primary">
              <Building2 size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-brand-accent">
                  {estateName}
                </h2>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                  Active
                </span>
              </div>
              <p className="mt-1 flex items-center gap-1 text-xs text-brand-accent/60">
                <MapPin size={13} className="shrink-0" />
                <span>{fullAddress}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-brand-accent/5 pt-3 md:border-t-0 md:pt-0">
            <div className="flex items-center gap-2 rounded-sm border border-brand-accent/10 bg-brand-accent/[0.02] px-3 py-2 text-xs">
              <Tag size={14} className="text-brand-accent/60" />
              <div>
                <span className="text-brand-accent/50">Category: </span>
                <span className="font-semibold text-brand-accent">{propertyType}</span>
              </div>
            </div>

            <div className="rounded-sm border border-brand-accent/10 bg-brand-accent/[0.02] px-3 py-2 text-xs">
              <span className="text-brand-accent/50">Monthly Rate: </span>
              <span className="font-semibold text-brand-primary">
                {formatCurrency(propertyFee, "NGN")}
              </span>
            </div>
          </div>
        </div>
      </div>

      <DashboardGrid user={user} />
    </div>
  );
}

export default Dashboard;
