// hooks/useBootstrapAuth.ts
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { setCredentials, setBootstrapping, clearAuth } from "@/features/auth/authSlice";
import { refreshAccess } from "@/auth/api/authApi";

export default function useBootstrapAuth() {
  const dispatch = useDispatch();
  const { isBootstrapping, refreshToken } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const bootstrap = async () => {
      if (!refreshToken) {
        dispatch(clearAuth());
        return;
      }

      try {
        const data = await refreshAccess();
        dispatch(setCredentials(data));
      } catch (err) {
        console.error("Failed to refresh token", err);
        dispatch(clearAuth());
      } finally {
        dispatch(setBootstrapping(false));
      }
    };

    if (isBootstrapping) {
      bootstrap();
    }
  }, [dispatch, isBootstrapping, refreshToken]);
}
