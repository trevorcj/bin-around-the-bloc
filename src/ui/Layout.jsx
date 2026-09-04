import { Outlet } from "react-router-dom";
import ProfileChip from "./ProfileChip";
import Sidebar from "./Sidebar";

function Layout({ user }) {
  return (
    <>
      <Sidebar />

      <div className="p-4 sm:ml-74">
        <div className="flex justify-end">
          <ProfileChip user={user} />
        </div>

        <div className="mt-6">
          <Outlet />
        </div>
      </div>
    </>
  );
}

export default Layout;
