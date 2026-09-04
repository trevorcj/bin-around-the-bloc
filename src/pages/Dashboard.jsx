import { StyledH1 } from "../styles/CommonStyles";
import DashboardGrid from "../ui/DashboardGrid";

function Dashboard({ user }) {
  return (
    <>
      <StyledH1>Hello, {user?.fullname} 👋🏽</StyledH1>

      <p className="text-brand-accent/80 mt-2">
        Manage your account, track payments, and see your next collection day.
      </p>

      <DashboardGrid />
    </>
  );
}

export default Dashboard;
