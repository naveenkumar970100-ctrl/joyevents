import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Layout from "@/components/Layout";
import { toast } from "sonner";
import { Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import { dashboardPaths, roleLabels } from "@/lib/auth";
import { apiLogin } from "@/lib/api";
import { Link } from "react-router-dom";
import { setSessionActive } from "@/lib/session";
import { sanitizeEmailInput, validateLoginForm, EMAIL_HINT, EMAIL_MAX_LENGTH } from "@/lib/validation";

const Login = () => {
  const { role, setRole, setIsLoggedIn, setToken, setUser, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const redirectParam = searchParams.get("redirect");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // If already logged in, check if we should redirect to dashboard or wait for authReturnTo
  useEffect(() => {
    sessionStorage.removeItem("forceLoginNoRedirect");
    if (!redirectParam) {
      localStorage.removeItem("authReturnTo");
    }
    console.log('📋 Login useEffect - isLoggedIn:', isLoggedIn, 'role:', role, 'redirectParam:', redirectParam);
    
    if (isLoggedIn && role && !redirectParam) {
      console.log('✅ Already logged in with no return URL, redirecting to dashboard');
      navigate(dashboardPaths[role], { replace: true });
    } else if (isLoggedIn && role && redirectParam) {
      console.log('⏳ Already logged in WITH redirect, will auto-redirect...');
      setTimeout(() => {
        navigate(redirectParam, { replace: true });
      }, 100);
    }
  }, [isLoggedIn, role, navigate, redirectParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formErr = validateLoginForm(email, password);
    if (formErr) {
      toast.error(formErr);
      return;
    }
    try {
      const res = await apiLogin({ email, password });
      const userRole = res?.user?.role === "user" ? "customer" : res?.user?.role;
      
      // Update localStorage immediately so ProtectedRoute can see it
      localStorage.setItem("token", res?.token || "");
      localStorage.setItem("user", JSON.stringify(res?.user ? {
        _id: res.user._id || res.user.id,
        name: res.user.name,
        email: res.user.email,
        role: userRole,
      } : {}));
      localStorage.setItem("role", userRole);

      // Update state
      setToken(res?.token || null);
      setUser(res?.user ? {
        _id: res.user._id || res.user.id,
        name: res.user.name,
        email: res.user.email,
        role: userRole,
        createdAt: res.user.createdAt || "",
        updatedAt: res.user.updatedAt || "",
      } : null);
      setRole(userRole);
      setIsLoggedIn(true);
      setSessionActive();
      
      toast.success(`${roleLabels[userRole]} login successful!`);
      const target = redirectParam || dashboardPaths[userRole];
      if (!redirectParam) {
        localStorage.removeItem("authReturnTo");
      }
      navigate(target, { replace: true });
    } catch (err: any) {
      toast.error(err?.message || "Something went wrong");
    }
  };

  return (
    <Layout>
      <section className="flex min-h-[80vh] items-center justify-center py-12 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-2xl rounded-2xl border border-border bg-card p-8"
        >
          <div className="mb-8 text-center">
            <h1 className="font-display text-3xl font-bold">Welcome Back</h1>
            <p className="mt-2 text-sm text-muted-foreground">Enter your credentials to access your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-sm text-muted-foreground">Email</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input type="text" inputMode="email" autoComplete="email" placeholder="user@gmail.com" maxLength={EMAIL_MAX_LENGTH} className="border-border bg-secondary pl-10" value={email} onChange={(e) => setEmail(sanitizeEmailInput(e.target.value))} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{EMAIL_HINT}</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Password</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input type={showPassword ? "text" : "password"} placeholder="••••••••" className="border-border bg-secondary pl-10 pr-10" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link
                to={`/forgot-password${redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : ""}`}
                className="text-sm font-medium text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <Button type="submit" className="w-full bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-90" size="lg">
              Sign In
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link 
              to={`/register${redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : ""}`} 
              className="font-medium text-primary hover:underline"
            >
              Create Account
            </Link>
          </p>
        </motion.div>
      </section>
    </Layout>
  );
};

export default Login;

