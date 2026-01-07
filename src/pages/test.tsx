import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, Navigate } from "react-router-dom";
import { Lock, User, LogIn, Loader2, Truck, Mail } from "lucide-react";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useDispatch, useSelector } from "react-redux";
import { AxiosError } from "axios";

import { login } from "@/auth/api/authApi";
import { setCredentials } from "@/features/auth/authSlice";
import { RootState, AppDispatch } from "@/store/store";

export const Login = () => {
  const [username, setUsername] = useState(""); 
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; password?: string }>(
    {}
  );

  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { isAuthenticated } = useSelector(
    (state: RootState) => state.auth
  );

  if (isAuthenticated) {
    return <Navigate to="/form" replace />;
  }

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!username.trim()) newErrors.username = "Username is required";
    if (!password.trim()) newErrors.password = "Password is required";
    if (password.length < 4)
      newErrors.password = "Password must be at least 4 characters";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);

    try {
      const res = await login({
        email: username, 
        password,
      });

      dispatch(
        setCredentials({
          access: res.access,
          refresh: res.refresh,
          user: res.user ?? null,
        })
      );

      navigate("/form");
    } catch (error) {
      const err = error as AxiosError<any>;

      const message =
        err.response?.data?.error?.message ??
        err.response?.data?.message ??
        "Invalid credentials or server error";

    } finally {
      setIsLoading(false);
    }
  };

  

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <AnimatedBackground />

      <div className="fixed right-4 top-4 z-50">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <div className="glass-card p-8">
          {/* Logo */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mb-8 flex flex-col items-center"
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 animate-glow-pulse">
              <Truck className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              <span className="text-gradient">Transport</span>
              <span className="text-muted-foreground">Pro</span>
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in to manage your transport data
            </p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="email"
                  className="w-full rounded-xl border border-border/50 bg-secondary/50 py-3 pl-11 pr-4 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              {errors.username && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.username}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full rounded-xl border border-border/50 bg-secondary/50 py-3 pl-11 pr-4 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Submit */}
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </>
              )}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
