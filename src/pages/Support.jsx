import { Copy, Headset, Mail, MessageCircle, Phone } from "lucide-react";
import showToast from "../utils/showToast";
import { StyledH1 } from "../styles/CommonStyles";

const SUPPORT_CHANNELS = [
  {
    title: "Email Us",
    detail: "trevorcjustus@gmail.com",
    note: "Replies within one business day",
    icon: Mail,
  },
  {
    title: "Call Us",
    detail: "+234 814 629 0156",
    note: "Mon - Fri, 8AM - 5PM",
    icon: Phone,
  },
  {
    title: "WhatsApp",
    detail: "+234 916 553 6637",
    note: "Quick responses during business hours",
    icon: MessageCircle,
  },
];

const whatsAppBaseUrl = `https://wa.me`;
const whatsAppNumber = "2349165536637";

function Support() {
  async function handleCopyEmail(email) {
    try {
      await navigator.clipboard.writeText(email);
      showToast("success", "Copied");
    } catch {
      showToast("error", "Unable to copy");
    }
  }

  return (
    <div className="space-y-6 pb-8">
      <div>
        <StyledH1>Support</StyledH1>
        <p className="mt-2 text-brand-accent/80">
          We&apos;re here to help with payments, receipts, and your account.
        </p>
      </div>

      <section
        className="rounded-sm border border-brand-accent/10 p-6 sm:p-8"
        style={{
          background:
            "linear-gradient(120deg, rgba(90, 183, 118, 0.12), rgba(255, 255, 255, 1))",
        }}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-primary text-white">
              <Headset size={28} />
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-brand-accent">
                How can we help you today?
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-brand-accent/65">
                Our support team is ready to assist with billing questions,
                receipts, and account issues.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-sm border border-brand-accent/10 bg-white p-6 ">
        <div>
          <h2 className="text-xl font-semibold text-brand-accent">
            Still need help?
          </h2>
          <p className="mt-2 text-sm text-brand-accent/60">
            You can reach us directly and our team will respond as soon as
            possible.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {SUPPORT_CHANNELS.map(({ title, detail, note, icon: Icon }) => (
            <article
              key={title}
              className="rounded-sm border border-brand-accent/10 bg-brand-accent/1.5 p-5 transition-colors hover:bg-brand-accent/3">
              <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-brand-primary/8 text-brand-primary">
                <Icon size={20} />
              </div>

              <h3 className="mt-4 text-lg font-semibold text-brand-accent">
                {title}
              </h3>
              <div className="mt-2 flex items-center gap-2">
                {title === "Call Us" ? (
                  <p className="text-sm font-medium text-brand-accent">
                    <a href={`tel:${detail}`} className="hover:underline">
                      {detail}
                    </a>
                  </p>
                ) : title === "WhatsApp" ? (
                  <p className="text-sm font-medium text-brand-accent">
                    <a
                      href={`${whatsAppBaseUrl}/${whatsAppNumber}`}
                      className="hover:underline">
                      {detail}
                    </a>
                  </p>
                ) : (
                  <p className="text-sm font-medium text-brand-accent">
                    {detail}
                  </p>
                )}
                {title === "Email Us" ? (
                  <button
                    type="button"
                    onClick={() => handleCopyEmail(detail)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-brand-accent/10 text-brand-accent/60 transition-colors hover:bg-brand-accent/4 hover:text-brand-accent cursor-pointer"
                    aria-label="Copy support email">
                    <Copy size={16} />
                  </button>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-brand-accent/55">{note}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Support;
