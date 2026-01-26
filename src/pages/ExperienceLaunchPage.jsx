import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Button from "../components/Button";
import { useAuth } from "../context/AuthContext";
import {
  fetchExperiencesForUser,
  isCatalogConfigured,
} from "../services/catalogService";

const iconClasses = "h-5 w-5";

const icons = {
  settings: (
    <svg viewBox="0 0 24 24" fill="none" className={iconClasses}>
      <path
        d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M19.4 15.1c.3-.6.5-1.3.6-2l1.7-1.3-1.9-3.3-2.1.4a7.1 7.1 0 0 0-1.7-1l-.4-2.1H8.4l-.4 2.1c-.6.2-1.2.6-1.7 1L4.2 8.5 2.3 11.8 4 13c.1.7.3 1.4.6 2l-1.2 1.8 2.9 2.4 1.8-1.2c.6.4 1.2.7 1.9.9l.4 2.1h5.2l.4-2.1c.7-.2 1.3-.5 1.9-.9l1.8 1.2 2.9-2.4-1.2-1.8Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  ),
  metrics: (
    <svg viewBox="0 0 24 24" fill="none" className={iconClasses}>
      <path
        d="M4 20V10m6 10V4m6 16v-7m4 7H2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  report: (
    <svg viewBox="0 0 24 24" fill="none" className={iconClasses}>
      <path
        d="M6 4h8l4 4v12H6V4Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M14 4v4h4M8.5 12h7M8.5 16h5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  quit: (
    <svg viewBox="0 0 24 24" fill="none" className={iconClasses}>
      <path
        d="M9 6h9a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="m12 8-4 4 4 4M4 12h8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  loading: (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
      <path
        d="M20 12a8 8 0 1 1-4-6.93"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M16 4v4h-4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

const normalizeExperience = (experience) => {
  const hasAccess =
    experience.hasAccess !== undefined
      ? experience.hasAccess
      : experience.status !== "locked";
  return {
    id: experience.id,
    title: experience.title,
    description: experience.description,
    imageUrl: experience.imageUrl || experience.imagePath || "",
    status: experience.status || (hasAccess ? "available" : "locked"),
    requiresAccess: !hasAccess,
    lockReason: experience.lockReason || "",
  };
};

function IconButton({ label, onClick, children, tone = "light" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition ${
        tone === "danger"
          ? "border-rose/60 bg-rose/15 text-rose hover:bg-rose/25"
          : "border-white/20 bg-white/10 text-sand hover:bg-white/20"
      }`}
      aria-label={label}
    >
      {children}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

export default function ExperienceLaunchPage() {
  const { experienceId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [phase, setPhase] = useState("loading");
  const [showMetrics, setShowMetrics] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(
    Boolean(document.fullscreenElement),
  );
  const [isPortrait, setIsPortrait] = useState(false);
  const catalogEnabled = isCatalogConfigured;
  const exitIntentRef = useRef(false);

  const { data: items = [] } = useQuery({
    queryKey: ["experiences", user?.email],
    queryFn: fetchExperiencesForUser,
    enabled: catalogEnabled,
  });

  const experience = useMemo(() => {
    const found = items.find((item) => item.id === experienceId);
    return found ? normalizeExperience(found) : null;
  }, [items, experienceId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPhase("ready");
    }, 3500);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const active = Boolean(document.fullscreenElement);
      setIsFullscreen(active);
      if (!active && phase === "ready" && !exitIntentRef.current) {
        setShowExitConfirm(true);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [phase]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(orientation: portrait)");

    const handleOrientationChange = () => {
      setIsPortrait(mediaQuery.matches);
    };

    handleOrientationChange();
    mediaQuery.addEventListener?.("change", handleOrientationChange);

    return () => {
      mediaQuery.removeEventListener?.("change", handleOrientationChange);
    };
  }, []);

  useEffect(() => {
    if (!isFullscreen) {
      return;
    }

    const orientation = window.screen?.orientation;
    orientation?.lock?.("landscape").catch(() => {});

    return () => {
      orientation?.unlock?.();
    };
  }, [isFullscreen]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        exitIntentRef.current = false;
        setShowExitConfirm(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const exitSession = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    }
    const fallback = "/dashboard";
    const target =
      location.state?.from?.pathname || location.state?.from || fallback;
    navigate(target, { replace: true });
  };

  const handleQuitClick = () => {
    exitIntentRef.current = true;
    setShowExitConfirm(true);
  };

  const handleStay = async () => {
    exitIntentRef.current = false;
    setShowExitConfirm(false);
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen?.().catch(() => {});
    }
  };

  const handleConfirmQuit = () => {
    exitIntentRef.current = true;
    setShowExitConfirm(false);
    exitSession();
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink text-sand">
      {/* Background blurred circles */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#2b2621,transparent_70%)]" />
      <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-brand/20 blur-3xl" />
      <div className="absolute bottom-0 left-10 h-72 w-72 rounded-full bg-rose/20 blur-3xl" />

      <div className="relative z-10 flex min-h-screen flex-col gap-8 px-6 py-8 md:px-12 md:py-10">
        {isPortrait ? (
          <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-xs text-sand/80">
            Rotate your device for the best experience.
          </div>
        ) : null}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-sand/60">
              Experience
            </p>
            <h1 className="mt-2 font-display text-3xl text-sand">
              {experience?.title || "Launching experience"}
            </h1>
          </div>
          <div className="flex items-center gap-3 text-xs text-sand/70">
            <span className="rounded-full border border-white/20 px-3 py-1">
              Session loading
            </span>
            <span className="hidden sm:inline">
              User: {user?.email || "Guest"}
            </span>
          </div>
        </header>

        <main className="flex flex-1 flex-col items-center justify-center text-center">
          {phase === "loading" ? (
            <div className="space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-white/15 bg-white/5">
                <div className="animate-spin">{icons.loading}</div>
              </div>
              <p className="text-lg font-semibold text-sand">
                Preparing the experience...
              </p>
              <p className="text-sm text-sand/70">
                Syncing assets, booting the session, and checking network
                conditions.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm uppercase tracking-[0.3em] text-sand/60">
                Live session
              </p>
              <h2 className="font-display text-2xl text-sand">
                Experience overlay ready
              </h2>
              <p className="text-sm text-sand/70">
                Placeholder UI is ready. Swap this with the actual experience
                surface when your backend is live.
              </p>
            </div>
          )}
        </main>

        <footer className="space-y-4">
          {!isFullscreen ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-xs text-sand/70">
              <span>Not in fullscreen mode.</span>
              <button
                type="button"
                onClick={() =>
                  document.documentElement.requestFullscreen?.().catch(() => {})
                }
                className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-sand transition hover:bg-white/10"
              >
                Re-enter fullscreen
              </button>
            </div>
          ) : null}
          {experience?.requiresAccess ? (
            <div className="rounded-2xl border border-rose/40 bg-rose/10 px-4 py-3 text-sm text-rose">
              {experience.lockReason ||
                "This experience is locked. Request access to continue."}{" "}
              <Link to="/dashboard" className="font-semibold underline">
                Return to dashboard
              </Link>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <IconButton label="Quit" tone="danger" onClick={handleQuitClick}>
                {icons.quit}
              </IconButton>
              <IconButton label="Settings" onClick={() => {}}>
                {icons.settings}
              </IconButton>
              <IconButton
                label="Metrics"
                onClick={() => setShowMetrics((prev) => !prev)}
              >
                {icons.metrics}
              </IconButton>
              <IconButton
                label="Report"
                onClick={() => window.alert("Reporting is not available yet.")}
              >
                {icons.report}
              </IconButton>
            </div>
            <div className="text-xs text-sand/60">
              Resolution 1920×1080 · Latency 42ms · Region eu-west-2
            </div>
          </div>

          {showMetrics ? (
            <div className="grid gap-3 rounded-2xl border border-white/15 bg-white/5 px-4 py-4 text-xs text-sand/80 sm:grid-cols-3">
              <div>
                <p className="uppercase tracking-[0.2em] text-sand/50">
                  Bandwidth
                </p>
                <p className="mt-1 text-sm font-semibold text-sand">28 Mbps</p>
              </div>
              <div>
                <p className="uppercase tracking-[0.2em] text-sand/50">
                  Packet loss
                </p>
                <p className="mt-1 text-sm font-semibold text-sand">0.3%</p>
              </div>
              <div>
                <p className="uppercase tracking-[0.2em] text-sand/50">FPS</p>
                <p className="mt-1 text-sm font-semibold text-sand">60 fps</p>
              </div>
            </div>
          ) : null}

          <div className="text-xs text-sand/50">
            Tip: press Esc to exit fullscreen or use the Quit button.
          </div>
        </footer>
      </div>

      {showExitConfirm ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-ink/70 px-6 text-sand">
          <div className="w-full max-w-md rounded-3xl border border-white/15 bg-ink/90 p-6 text-center shadow-soft">
            <p className="text-xs uppercase tracking-[0.3em] text-sand/60">
              Leave experience?
            </p>
            <h2 className="mt-3 font-display text-2xl text-sand">
              Do you want to quit this session?
            </h2>
            <p className="mt-3 text-sm text-sand/70">
              You can re-enter fullscreen and keep exploring, or exit back to
              the catalog.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button variant="secondary" onClick={handleStay}>
                Stay in experience
              </Button>
              <Button onClick={handleConfirmQuit}>Quit</Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
