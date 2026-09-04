import { Link, Navigate, useNavigate } from "react-router-dom";
import { StyledDiv, HeroSection } from "../../styles/CommonStyles";
import Button from "../../ui/Button";
import InputUi from "../../ui/Input";
import { useForm } from "react-hook-form";
import useAuth from "../../hooks/useAuth";
import showToast from "../../utils/showToast";

function AdminSignup() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const { registerAdmin, loading, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated && user?.role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  const inputErrorClasses = "text-sm text-red-500";

  async function onSubmit(data) {
    try {
      await registerAdmin({
        fullname: data.fullname,
        email: data.email,
        password: data.password,
        phone: data.phone,
        estateName: data.estateName,
        location: data.location,
        description: data.description,
      });

      showToast("success", "Estate & Admin account successfully created!");
      navigate("/admin");
    } catch (err) {
      showToast(
        "error",
        err.message || "Failed to create estate admin account.",
      );
    }
  }

  return (
    <StyledDiv>
      <HeroSection>
        <div className="relative z-10 max-w-md">
          <h1 className="mb-10 text-4xl sm:text-5xl font-headlines tracking-tight">
            Seamless Estate Billing & Payment Reconciliation
          </h1>

          <p className="text-white/80 text-lg leading-relaxed mb-12">
            Configure property tiers, onboard residents with your unique estate
            code, track waste collection fees, and reconcile bank and online
            payments effortlessly.
          </p>

          <div className="flex items-center gap-4 mt-8 flex-wrap">
            <span className="font-semibold text-[13px] tracking-widest uppercase text-white/80">
              Multi-tenant Estate Administration
            </span>
          </div>
        </div>
      </HeroSection>

      <div className="bg-white text-brand-accent p-16 h-full overflow-y-auto">
        <img src="/logo.svg" className="h-8 mb-12" alt="batb logo" />

        <h1 className="text-2xl font-semibold text-brand-accent mb-6">
          Register your Estate
        </h1>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="my-6 flex flex-col gap-2">
          <div className="space-y-3 pb-3 border-b border-brand-accent/10">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-brand-accent/60">
              Administrator Profile
            </h2>

            <InputUi
              label="Full name"
              type="text"
              required
              {...register("fullname", {
                required: "Your full name is required",
              })}
            />
            {errors.fullname && (
              <p className={inputErrorClasses}>{errors.fullname.message}</p>
            )}

            <InputUi
              label="Admin email address"
              type="email"
              required
              {...register("email", { required: "Email address is required" })}
            />
            {errors.email && (
              <p className={inputErrorClasses}>{errors.email.message}</p>
            )}

            <InputUi
              label="Password"
              type="password"
              required
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 8,
                  message: "Password must be at least 8 characters long",
                },
              })}
            />
            {errors.password && (
              <p className={inputErrorClasses}>{errors.password.message}</p>
            )}

            <InputUi
              label="Phone number"
              type="tel"
              required
              {...register("phone", { required: "Phone number is required" })}
            />
            {errors.phone && (
              <p className={inputErrorClasses}>{errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-3 pt-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-brand-accent/60">
              Estate Information
            </h2>

            <InputUi
              label="Estate name (e.g. Lekki Gardens Estate)"
              type="text"
              required
              {...register("estateName", {
                required: "Estate name is required",
              })}
            />
            {errors.estateName && (
              <p className={inputErrorClasses}>{errors.estateName.message}</p>
            )}

            <InputUi
              label="Estate location / area (e.g. Lekki Phase 1, Lagos)"
              type="text"
              {...register("location")}
            />

            <InputUi
              label="Brief description (optional)"
              type="text"
              {...register("description")}
            />
          </div>

          <Button disabled={loading} type="submit" className="mt-6">
            {loading ? "Creating Estate..." : "Create Estate & Dashboard"}
          </Button>
        </form>

        <div className="space-y-3">
          <p>
            Already have an estate account?{" "}
            <Link to="/login" className="inline-link">
              Sign in
            </Link>
          </p>

          <p className="text-sm text-brand-accent/65">
            Are you a resident registering to pay waste fees?{" "}
            <Link to="/signup" className="inline-link font-medium">
              Join your estate as a resident
            </Link>
          </p>
        </div>
      </div>
    </StyledDiv>
  );
}

export default AdminSignup;
