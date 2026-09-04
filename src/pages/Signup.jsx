import { Link, Navigate, useNavigate } from "react-router-dom";
import { StyledDiv, HeroSection } from "../styles/CommonStyles";
import Button from "../ui/Button";
import InputUi from "../ui/Input";
import { Info } from "lucide-react";
import { useForm } from "react-hook-form";
import useAuth from "../hooks/useAuth";
import showToast from "../utils/showToast";

function Signup() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const { registerUser, loading } = useAuth();
  const navigate = useNavigate();

  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const inputErrorClasses = "text-sm text-red-500";

  async function onSubmit(data) {
    try {
      await registerUser({ ...data, createdat: new Date().toISOString() });

      navigate("/");

      showToast("success", "Account successfully created!");
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
          Join bin around the bloc'
        </h1>

        {/* Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="my-6 flex flex-col gap-2">
          <InputUi
            label="Full name"
            type="text"
            className="mt-2"
            required
            {...register("fullname", { required: "This field is required" })}
          />
          {errors.fullname && (
            <p className={inputErrorClasses}>{errors.fullname.message}</p>
          )}

          <InputUi
            label="Email address"
            type="email"
            className="mt-2"
            required
            {...register("email", { required: "This field is required" })}
          />
          {errors.email && (
            <p className={inputErrorClasses}>{errors.email.message}</p>
          )}

          <InputUi
            label="Password"
            type="password"
            className="mt-2"
            required
            {...register("password", {
              required: "This field is required",
              minLength: {
                value: 8,
                message: "Password must be at least 8 characters long",
              },
              validate: {
                hasUppercase: (value) =>
                  /[A-Z]/.test(value) ||
                  "Password must contain at least one uppercase letter",
                hasSpecialChar: (value) =>
                  /[!@#$%^&*(),.?":{}|<>_]/.test(value) ||
                  "Password must contain at least one special character",
              },
            })}
          />
          {errors.password && (
            <p className={inputErrorClasses}>{errors.password.message}</p>
          )}

          <InputUi
            label="Phone number"
            type="tel"
            className="mt-2"
            required
            {...register("phone", { required: "This field is required" })}
          />
          {errors.phone && (
            <p className={inputErrorClasses}>{errors.phone.message}</p>
          )}

          <InputUi
            label="House number (e.g. 23)"
            type="number"
            className="mt-2"
            required
            {...register("housenumber", { required: "This field is required" })}
          />
          {errors.housenumber && (
            <p className={inputErrorClasses}>{errors.housenumber.message}</p>
          )}

          <InputUi
            label="Address (e.g. Paris Agaro Avenue, Liberty Estate)"
            type="text"
            className="mt-2"
            required
            {...register("streetname", { required: "This field is required" })}
          />
          {errors.streetname && (
            <p className={inputErrorClasses}>{errors.streetname.message}</p>
          )}

          <InputUi
            label="Unit/Apt (e.g. Flat 3) (optional)"
            type="text"
            className="mt-2"
            {...register("apartment")}
          />

          <Button disabled={loading} type="submit" className="mt-4">
            {loading ? "Creating account" : "Create my account"}
          </Button>
        </form>

        <p>
          Don't have account?{" "}
          <Link to="/login" className="inline-link">
            Login
          </Link>
        </p>

        <hr className="mt-6 text-brand-accent/10" />

        <p className="mt-6 text-brand-accent/60 flex gap-2">
          <Info />
          <span>
            By creating an account, you agree to the{" "}
            <span className="underline cursor-pointer">Terms of Service</span>{" "}
            and acknowledge the{" "}
            <span className="underline cursor-pointer">privacy policy</span>.
          </span>
        </p>
      </div>
    </StyledDiv>
  );
}

export default Signup;
