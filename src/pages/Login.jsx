import { Link, Navigate, useNavigate } from "react-router-dom";
import { StyledDiv, HeroSection } from "../styles/CommonStyles";

import InputUi from "../ui/Input";
import Button from "../ui/Button";
import { useForm } from "react-hook-form";
import useAuth from "../hooks/useAuth";
import showToast from "../utils/showToast";

function Login() {
  const { register, handleSubmit } = useForm();
  const { loginUser, loading } = useAuth();
  const navigate = useNavigate();

  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  async function onSubmit({ email, password }) {
    try {
      await loginUser(email, password);

      navigate("/");

      showToast("success", "Successfully logged in");
    } catch (err) {
      showToast("error", err.message);
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
            className="mt-2"
            {...register("email")}
          />
          <InputUi
            label="Password"
            type="password"
            className="mt-2"
            {...register("password")}
          />
          <Button type="submit" disabled={loading} className="mt-4">
            {loading ? "Signing in" : "Sign in"}
          </Button>
        </form>

        <p>
          Don't have account?{" "}
          <Link to="/signup" className="inline-link">
            Create an account
          </Link>
        </p>
      </div>
    </StyledDiv>
  );
}

export default Login;
