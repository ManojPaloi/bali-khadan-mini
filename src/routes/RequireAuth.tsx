import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";
import { RootState } from "@/store/store";

const RequireAuth = () => {
  const { isAuthenticated, isBootstrapping } = useSelector(
    (state: RootState) => state.auth
  );

  // Show Loading while Redux Persist hydrates
  if (isBootstrapping) {
    return (
      <div className="flex items-center justify-center h-screen text-lg font-medium">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default RequireAuth;
