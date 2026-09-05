import { Link, Navigate, useNavigate } from "react-router-dom";
import { StyledDiv, HeroSection } from "../styles/CommonStyles";

import InputUi from "../ui/Input";
import Button from "../ui/Button";
import { useForm } from "react-hook-form";
import useAuth from "../hooks/useAuth";
import showToast from "../utils/showToast";

function Login() {
  const { register, handleSubmit } = useForm();
  const { loginUser, loading, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated && user) {
    if (user.role === "admin") {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/app" replace />;
  }

  async function onSubmit({ email, password }) {
    try {
      const loggedInUser = await loginUser(email, password);

      showToast("success", "Successfully logged in");

      if (loggedInUser?.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/app");
      }
    } catch (err) {
      showToast("error", err.message || "Failed to sign in. Check your credentials.");
    }
  }

  return (
    <StyledDiv>
      <HeroSection>
        <div className="relative z-10 max-w-md">
          <h1 className="mb-10 text-4xl sm:text-5xl font-headlines tracking-tight">
            Better waste management for a sustainable future
          </h1>

          <div className="flex items-center gap-4 mt-20 flex-wrap">
            <span className="font-semibold text-[13px] tracking-widest uppercase text-white/80">
              Secure payments powered by
            </span>
            <img src="/paystack.svg" alt="paystack logo" className="h-5" />
          </div>
        </div>
      </HeroSection>

      <div className="bg-white text-brand-accent p-16 h-full overflow-y-auto">
        <img src="/logo.svg" className="h-8 mb-12" alt="batb logo" />

        <h1 className="text-brand-accent/70 uppercase tracking-widest mb-6">
          Welcome back
        </h1>

        {/* Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="my-6 flex flex-col gap-2">
          <InputUi
            label="Email address"
            type="email"
            required
            className="mt-2"
            {...register("email", { required: true })}
          />
          <InputUi
            label="Password"
            type="password"
            required
            className="mt-2"
            {...register("password", { required: true })}
          />
          <Button type="submit" disabled={loading} className="mt-4">
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <div className="space-y-3">
          <p>
            Don't have an account?{" "}
            <Link to="/signup" className="inline-link">
              Create an account
            </Link>
          </p>

          <p className="text-sm text-brand-accent/65">
            Are you an estate administrator?{" "}
            <Link to="/admin/signup" className="inline-link font-medium">
              Register your estate
            </Link>
          </p>
        </div>
      </div>
    </StyledDiv>
  );
}

export default Login;

