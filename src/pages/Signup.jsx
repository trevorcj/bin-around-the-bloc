import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { StyledDiv, HeroSection } from "../styles/CommonStyles";
import Button from "../ui/Button";
import InputUi from "../ui/Input";
import DropdownUi from "../ui/DropdownUi";
import { CheckCircle2, Info, Loader2, XCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import useAuth from "../hooks/useAuth";
import showToast from "../utils/showToast";
import { validateEstateCode } from "../api/adminApi";
import formatCurrency from "../utils/formatCurrency";

function Signup() {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm();
  const { registerUser, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [estateCode, setEstateCode] = useState("");
  const [validatingCode, setValidatingCode] = useState(false);
  const [validatedEstate, setValidatedEstate] = useState(null);
  const [estateError, setEstateError] = useState("");
  const [availableStreets, setAvailableStreets] = useState([]);
  const [availablePropertyTypes, setAvailablePropertyTypes] = useState([]);
  const [selectedStreetId, setSelectedStreetId] = useState("");
  const [selectedPropertyTypeId, setSelectedPropertyTypeId] = useState("");

  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  const inputErrorClasses = "text-sm text-red-500";

  async function handleValidateEstateCode(codeToValidate) {
    const code = (codeToValidate || estateCode).trim();
    if (!code) {
      setEstateError("Please enter your estate code.");
      setValidatedEstate(null);
      return;
    }

    setValidatingCode(true);
    setEstateError("");

    try {
      const result = await validateEstateCode(code);
      if (result.valid) {
        setValidatedEstate(result.estate);
        setAvailableStreets(result.streets || []);
        setAvailablePropertyTypes(result.propertyTypes || []);
        setEstateError("");

        if (result.streets?.length > 0) {
          setSelectedStreetId(result.streets[0].id);
          setValue("streetname", result.streets[0].name);
        }

        if (result.propertyTypes?.length > 0) {
          setSelectedPropertyTypeId(result.propertyTypes[0].id);
        }
      } else {
        setValidatedEstate(null);
        setEstateError(result.message || "Estate code not found. Check the code and try again.");
      }
    } catch {
      setValidatedEstate(null);
      setEstateError("Unable to validate estate code. Please try again.");
    } finally {
      setValidatingCode(false);
    }
  }

  async function onSubmit(data) {
    if (!validatedEstate) {
      setEstateError("Please validate your Estate Code before creating an account.");
      showToast("error", "Please validate your Estate Code.");
      return;
    }

    const chosenPropertyType = availablePropertyTypes.find(
      (p) => p.id === selectedPropertyTypeId
    );

    const chosenStreet = availableStreets.find(
      (s) => s.id === selectedStreetId
    );

    if (availableStreets.length > 0 && !chosenStreet && !data.streetname) {
      showToast("error", "Please select your street.");
      return;
    }

    if (availablePropertyTypes.length > 0 && !chosenPropertyType) {
      showToast("error", "Please select your property type.");
      return;
    }

    try {
      const payload = {
        ...data,
        estate_id: validatedEstate.id,
        street_id: chosenStreet?.id || null,
        streetname: chosenStreet?.name || data.streetname?.trim(),
        property_type_id: chosenPropertyType?.id || null,
        property_type_name: chosenPropertyType?.name || null,
        property_fee: chosenPropertyType?.fee ?? 5000,
        createdat: new Date().toISOString(),
      };

      await registerUser(payload);
      showToast("success", "Account successfully created!");
      navigate("/app");
    } catch (err) {
      showToast("error", err.message || "Could not complete registration.");
    }
  }

  const streetOptions = availableStreets.map((s) => ({
    label: s.name,
    value: s.id,
  }));

  const propertyTypeOptions = availablePropertyTypes.map((p) => ({
    label: `${p.name} — ${formatCurrency(p.fee, "NGN")} / month`,
    value: p.id,
  }));

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
          {/* Step 1: Account Information */}
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

          {/* Step 2: Estate Code Lookup */}
          <div className="mt-2 pt-3 border-t border-brand-accent/10">
            <label className="block text-sm font-medium text-brand-accent mb-1">
              Estate Code <span className="text-status-error">*</span>
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={estateCode}
                onChange={(e) => {
                  setEstateCode(e.target.value.toUpperCase());
                  setValidatedEstate(null);
                  setEstateError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleValidateEstateCode();
                  }
                }}
                placeholder="e.g. LG-7X29"
                className="h-11 flex-1 rounded-sm border border-brand-accent/10 bg-brand-accent/5 px-3 py-1.5 text-sm uppercase tracking-wider font-semibold text-brand-accent focus:outline-1 focus:outline-brand-accent/25"
              />
              <button
                type="button"
                onClick={() => handleValidateEstateCode()}
                disabled={validatingCode || !estateCode.trim()}
                className="h-11 px-4 rounded-sm bg-brand-accent text-white text-sm font-medium hover:bg-brand-accent/90 disabled:opacity-50 cursor-pointer">
                {validatingCode ? (
                  <Loader2 className="animate-spin size-4" />
                ) : (
                  "Verify"
                )}
              </button>
            </div>

            {validatedEstate && (
              <div className="mt-2 p-3 bg-status-success/10 border border-status-success/20 rounded-sm flex items-center gap-2 text-sm text-status-success font-medium">
                <CheckCircle2 size={18} />
                <span>Estate found: {validatedEstate.name}</span>
              </div>
            )}

            {estateError && (
              <div className="mt-2 p-3 bg-status-error/10 border border-status-error/20 rounded-sm flex items-center gap-2 text-sm text-status-error">
                <XCircle size={18} />
                <span>{estateError}</span>
              </div>
            )}
          </div>

          {/* Step 3: Property Details (Active once Estate Code verified) */}
          {validatedEstate && (
            <div className="mt-3 pt-3 border-t border-brand-accent/10 space-y-3">
              {/* Street Selection */}
              {availableStreets.length > 0 ? (
                <div>
                  <label className="block text-sm font-medium text-brand-accent mb-1">
                    Street <span className="text-status-error">*</span>
                  </label>
                  <DropdownUi
                    options={streetOptions}
                    value={selectedStreetId}
                    onChange={(val) => {
                      setSelectedStreetId(val);
                      const s = availableStreets.find((st) => st.id === val);
                      if (s) setValue("streetname", s.name);
                    }}
                  />
                </div>
              ) : (
                <InputUi
                  label="Street name"
                  type="text"
                  required
                  {...register("streetname", { required: "Street name is required" })}
                />
              )}

              {/* Property Category Selection with Configured Fee */}
              {availablePropertyTypes.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-brand-accent mb-1">
                    Property Type & Monthly Fee <span className="text-status-error">*</span>
                  </label>
                  <DropdownUi
                    options={propertyTypeOptions}
                    value={selectedPropertyTypeId}
                    onChange={setSelectedPropertyTypeId}
                  />
                </div>
              )}

              {/* Property Number */}
              <InputUi
                label="Property / House / Shop number (e.g. 14, Shop 4)"
                type="text"
                required
                {...register("housenumber", { required: "Property number is required" })}
              />
              {errors.housenumber && (
                <p className={inputErrorClasses}>{errors.housenumber.message}</p>
              )}

              <InputUi
                label="Unit / Apt (e.g. Flat 3) (optional)"
                type="text"
                {...register("apartment")}
              />
            </div>
          )}

          <Button
            disabled={loading || !validatedEstate}
            type="submit"
            className="mt-4">
            {loading ? "Creating account..." : "Create my account"}
          </Button>
        </form>

        <div className="space-y-3">
          <p>
            Already have an account?{" "}
            <Link to="/login" className="inline-link">
              Login
            </Link>
          </p>

          <p className="text-sm text-brand-accent/65">
            Are you an estate administrator?{" "}
            <Link to="/admin/signup" className="inline-link font-medium">
              Register your estate
            </Link>
          </p>
        </div>

        <hr className="mt-6 text-brand-accent/10" />

        <p className="mt-6 text-brand-accent/60 flex gap-2">
          <Info size={20} className="shrink-0 mt-0.5" />
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

