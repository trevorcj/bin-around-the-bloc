import { UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { StyledH1 } from "../styles/CommonStyles";
import InputUi from "../ui/Input";
import useAuth from "../hooks/useAuth";
import Button from "../ui/Button";
import { useForm } from "react-hook-form";
import showToast from "../utils/showToast";
import updateUserProfile from "../api/updateUserProfile";

function Settings() {
  const { user, setUser } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [originalEmail, setOriginalEmail] = useState(
    user?.email ||
      localStorage.getItem("userEmail") ||
      sessionStorage.getItem("userEmail") ||
      "",
  );
  const phoneValidation = {
    required: "Phone number is required.",
    minLength: {
      value: 10,
      message: "Phone number must be at least 10 digits.",
    },
    maxLength: {
      value: 11,
      message: "Phone number cannot be more than 11 digits.",
    },
    pattern: {
      value: /^[0-9]+$/,
      message: "Phone number should contain digits only.",
    },
    validate: {
      leadingZeroLimit: (value) =>
        !String(value || "").startsWith("0") ||
        String(value || "").length <= 11 ||
        "A phone number starting with 0 cannot be more than 11 digits.",
    },
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { isDirty, isSubmitting },
  } = useForm({
    defaultValues: {
      fullname: user?.fullname || "",
      email: user?.email || "",
      phone: user?.phone || "",
      housenumber: user?.housenumber || "",
      streetname: user?.streetname || "",
      apartment: user?.apartment || "",
    },
  });

  useEffect(() => {
    reset({
      fullname: user?.fullname || "",
      email: user?.email || "",
      phone: user?.phone || "",
      housenumber: user?.housenumber || "",
      streetname: user?.streetname || "",
      apartment: user?.apartment || "",
    });
  }, [reset, user]);

  async function onSubmit(values) {
    if (!user) {
      showToast("error", "Your account details are not available yet.");
      return;
    }

    const payload = {
      fullname: values.fullname.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      housenumber: values.housenumber,
      streetname: values.streetname.trim(),
      apartment: values.apartment?.trim() || "",
    };

    setIsSaving(true);

    try {
      await updateUserProfile(originalEmail, payload);
      const nextUser = { ...user, ...payload };

      setUser(nextUser);
      localStorage.setItem("user", JSON.stringify(nextUser));
      localStorage.setItem("userEmail", nextUser.email);
      sessionStorage.setItem("user", JSON.stringify(nextUser));
      sessionStorage.setItem("userEmail", nextUser.email);
      setOriginalEmail(nextUser.email);

      showToast("success", "Settings updated successfully.");
      reset(payload);
    } catch {
      showToast("error", "Unable to update your settings.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6 pb-8">
      <div>
        <StyledH1>Settings</StyledH1>
        <p className="mt-2 text-brand-accent/80">
          Manage your account details.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="rounded-sm border border-brand-accent/10 bg-white p-6 ">
          <div className="border-b border-brand-accent/10 pb-5">
            <h2 className="text-xl font-semibold text-brand-accent">
              Profile Information
            </h2>
            <p className="mt-1 text-sm text-brand-accent/55">
              Update the details tied to your account. Your receipts stay
              exactly as they were when they were created.
            </p>
          </div>

          <form className="mt-6 grid gap-4 " onSubmit={handleSubmit(onSubmit)}>
            <InputUi
              label="Full name"
              type="text"
              className="mt-2 bg-transparent"
              required
              {...register("fullname", { required: true })}
            />

            <InputUi
              label="Email address"
              type="email"
              className="mt-2 bg-transparent disabled:cursor-not-allowed disabled:bg-stone-300/15"
              required
              disabled
              {...register("email", { required: true })}
            />

            <InputUi
              label="Phone number"
              type="text"
              className="mt-2 bg-transparent"
              inputMode="numeric"
              autoComplete="tel"
              maxLength={11}
              minLength={10}
              placeholder="08012345678"
              required
              {...register("phone", phoneValidation)}
            />

            <InputUi
              label="House number (e.g. 23)"
              type="number"
              className="mt-2 bg-transparent"
              required
              {...register("housenumber", { required: true })}
            />

            <InputUi
              label="Address (e.g. Paris Agaro Avenue, Liberty Estate)"
              type="text"
              className="mt-2 bg-transparent"
              required
              {...register("streetname", { required: true })}
            />

            <InputUi
              label="Unit/Apt (e.g. Flat 3) (optional)"
              type="text"
              className="mt-2 bg-transparent"
              {...register("apartment")}
            />

            <div className="mt-2 flex flex-wrap gap-3">
              <Button
                type="submit"
                size="small"
                disabled={isSaving || isSubmitting || !isDirty}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>

              <button
                type="button"
                onClick={() =>
                  reset({
                    fullname: user?.fullname || "",
                    email: user?.email || "",
                    phone: user?.phone || "",
                    housenumber: user?.housenumber || "",
                    streetname: user?.streetname || "",
                    apartment: user?.apartment || "",
                  })
                }
                className="rounded-sm mt-2 text-center block border border-brand-accent/10 font-medium px-3 py-1.5 text-sm/6 cursor-pointer text-brand-accent transition-colors hover:bg-brand-accent/4">
                Cancel
              </button>
            </div>
          </form>
        </section>

        <aside className="space-y-6">
          <section className="rounded-sm border border-brand-accent/10 bg-white p-6 ">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-sm bg-brand-accent/4 text-brand-accent/70">
                <UserRound size={20} />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-brand-accent">
                  Account Preview
                </h3>
                <p className="mt-1 text-sm text-brand-accent/55">
                  A quick look at how your profile details are presented.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4 rounded-sm border border-brand-accent/10 bg-brand-accent/1.5 p-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-accent/40">
                  Name
                </p>
                <p className="mt-1 text-sm font-medium text-brand-accent">
                  {user?.fullname}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-accent/40">
                  Email
                </p>
                <p className="mt-1 text-sm font-medium text-brand-accent">
                  {user?.email}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-accent/40">
                  Address
                </p>
                <p className="mt-1 text-sm font-medium text-brand-accent">
                  {user?.housenumber}, {user?.streetname}
                </p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

export default Settings;
