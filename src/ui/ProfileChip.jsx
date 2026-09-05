import { Link } from "react-router-dom";

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function ProfileChip({ user }) {
  const name = user?.fullname ?? "Guest User";
  const initials = getInitials(name);

  return (
    <Link
      to="/app/settings"
      className="inline-flex items-center gap-3 rounded-full bg-white text-left text-brand-accent transition-colors ">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-accent text-sm font-semibold text-white">
        {initials}
      </div>
    </Link>
  );
}

export default ProfileChip;
