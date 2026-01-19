import { Link, Navigate } from "react-router-dom";
import Button from "../components/Button";
import { useAuth } from "../context/AuthContext";

const features = [
  {
    title: "Cognito-ready wiring",
    description:
      "Auth service placeholders map cleanly to Hosted UI or Amplify calls.",
  },
  {
    title: "Responsive by default",
    description:
      "Landing, auth, and dashboard layouts stay aligned on any device.",
  },
  {
    title: "Stateful UX",
    description:
      "Loading, error, and empty states are mocked so you can test early.",
  },
];

const steps = [
  {
    title: "Design the landing",
    description: "Lead with benefits and clear CTAs to sign up or log in.",
  },
  {
    title: "Collect credentials",
    description: "Accessible forms ready for Cognito responses and MFA hooks.",
  },
  {
    title: "Confirm identity",
    description: "Add verification or password reset flows once wired to AWS.",
  },
];

const stats = [
  { label: "Auth screens", value: "4" },
  { label: "Setup time", value: "1 day" },
  { label: "Cognito handoff", value: "Ready" },
];

export default function LandingPage() {
  const { user, isInitializing } = useAuth();

  if (isInitializing) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-12 text-sm text-slate">
        Checking your session...
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="relative">
      <section className="relative overflow-hidden">
        <div className="absolute -top-24 right-0 h-64 w-64 rounded-full bg-sun/50 blur-3xl" />
        <div className="absolute -bottom-24 left-10 h-72 w-72 rounded-full bg-rose/20 blur-3xl" />
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 lg:grid-cols-[1.2fr_0.8fr] lg:py-24">
          <div className="space-y-6">
            <p className="reveal text-xs uppercase tracking-[0.3em] text-slate">
              Cognito-ready UX
            </p>
            <h1 className="reveal reveal-delay-1 font-display text-4xl text-ink sm:text-5xl">
              Launch a login experience that feels finished on day one.
            </h1>
            <p className="reveal reveal-delay-2 text-lg text-slate">
              Build a landing page, auth flow, and dashboard that are ready to
              wire to AWS Cognito. Keep the UI crisp while the integration comes
              later.
            </p>
            <div className="reveal reveal-delay-3 flex flex-col gap-3 sm:flex-row">
              <Button as={Link} to="/signup">
                Create your account
              </Button>
              <Button as={Link} to="/login" variant="secondary">
                Log in
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-6 text-xs text-slate">
              {stats.map((stat) => (
                <div key={stat.label} className="flex items-center gap-2">
                  <span className="font-display text-lg text-ink">
                    {stat.value}
                  </span>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
          {/* <div className="relative">
            <div className="floaty rounded-3xl border border-white/60 bg-white/80 p-6 shadow-soft backdrop-blur">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate">
                    Preview
                  </p>
                  <h2 className="mt-2 font-display text-2xl text-ink">
                    Welcome back
                  </h2>
                </div>
                <span className="rounded-full bg-sand px-3 py-1 text-xs font-semibold text-slate">
                  Login
                </span>
              </div>
              <div className="mt-6 space-y-4 text-sm text-slate">
                <div className="rounded-2xl border border-clay/80 bg-mist px-4 py-3">
                  Email address
                </div>
                <div className="rounded-2xl border border-clay/80 bg-mist px-4 py-3">
                  Password
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-slate">
                <span>Remember me</span>
                <span>Forgot password?</span>
              </div>
              <div className="mt-6 flex items-center gap-3">
                <div className="h-10 flex-1 rounded-full bg-ink" />
                <div className="h-10 w-10 rounded-full border border-clay" />
              </div>
            </div>
          </div> */}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12" id="features">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate">
              Built for handoff
            </p>
            <h2 className="mt-3 font-display text-3xl text-ink">
              Everything you need for a clean auth UX
            </h2>
          </div>
          <p className="max-w-md text-sm text-slate">
            Keep the interface polished while your backend team wires Cognito.
            This layout is ready for hosted UI, Amplify, or custom auth flows.
          </p>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-soft backdrop-blur"
            >
              <h3 className="font-display text-xl text-ink">{feature.title}</h3>
              <p className="mt-3 text-sm text-slate">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="rounded-3xl border border-white/60 bg-ink p-8 text-sand shadow-soft">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-sand/70">
                How it works
              </p>
              <h2 className="mt-3 font-display text-3xl">
                A simple path from landing to dashboard
              </h2>
              <p className="mt-4 text-sm text-sand/80">
                Keep the flow tight and consistent. The auth screens and
                dashboard reuse the same layout rhythm.
              </p>
            </div>
            <div className="space-y-6">
              {steps.map((step, index) => (
                <div key={step.title} className="flex gap-4">
                  <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-sun text-ink">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-display text-lg">{step.title}</h3>
                    <p className="mt-2 text-sm text-sand/80">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20 pt-6">
        <div className="flex flex-col items-start justify-between gap-6 rounded-3xl border border-white/60 bg-white/85 p-8 shadow-soft backdrop-blur md:flex-row md:items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate">
              Ready to ship
            </p>
            <h2 className="mt-3 font-display text-2xl text-ink">
              Build the UI now, plug in Cognito later.
            </h2>
          </div>
          <Button as={Link} to="/signup">
            Start the flow
          </Button>
        </div>
      </section>
    </div>
  );
}
