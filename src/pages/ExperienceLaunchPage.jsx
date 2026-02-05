import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { BarChart3, Flag, LogOut, RotateCcw, Settings } from "lucide-react";
import Button from "../components/Button";
import { useAuth } from "../context/AuthContext";
import {
  fetchExperiencesForUser,
  isCatalogConfigured,
} from "../services/catalogService";
import {
  createPixelStreamingSession,
  isPixelStreamingConfigured,
} from "../services/pixelStreamingService";

const iconClasses = "h-5 w-5";

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

const defaultMetrics = {
  bitrate: "28.0",
  packetLoss: "0.3",
  fps: "60",
  resolution: "1920×1080",
  latency: "42",
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

const streamStateMessages = {
  loading: "Preparing experience shell...",
  booting: "Streamer is booting...",
  connecting: "Connecting to signalling server...",
  connected: "WebRTC connected. Waiting for media...",
  reconnecting: "Connection dropped. Reconnecting...",
  error: "Stream unavailable right now.",
};

export default function ExperienceLaunchPage() {
  const { experienceId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [streamState, setStreamState] = useState(
    isPixelStreamingConfigured ? "connecting" : "loading",
  );
  const [streamError, setStreamError] = useState("");
  const [showMetrics, setShowMetrics] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(
    Boolean(document.fullscreenElement),
  );
  const [isPortrait, setIsPortrait] = useState(false);
  const [uiVisible, setUiVisible] = useState(true);
  const [metrics, setMetrics] = useState(defaultMetrics);
  const [inputSettings, setInputSettings] = useState({
    mouse: true,
    keyboard: true,
    touch: true,
    hoveringMouse: false,
    fakeMouseWithTouches: false,
  });

  const streamContainerRef = useRef(null);
  const sessionRef = useRef(null);
  const idleTimerRef = useRef(null);
  const exitIntentRef = useRef(false);
  const statsHistoryRef = useRef({
    bytesReceived: null,
    timestamp: null,
  });

  const catalogEnabled = isCatalogConfigured;

  useEffect(() => {
    console.log(
      "[PixelStreaming] VITE_PIXEL_STREAMING_URL =",
      import.meta.env.VITE_PIXEL_STREAMING_URL || "(not set)",
    );
  }, []);
  const { data: items = [] } = useQuery({
    queryKey: ["experiences", user?.email],
    queryFn: fetchExperiencesForUser,
    enabled: catalogEnabled,
  });

  const experience = useMemo(() => {
    const found = items.find((item) => item.id === experienceId);
    return found ? normalizeExperience(found) : null;
  }, [items, experienceId]);

  const phase = streamState === "streaming" ? "ready" : "loading";

  useEffect(() => {
    if (experience?.requiresAccess) {
      return;
    }

    if (!isPixelStreamingConfigured) {
      const timer = window.setTimeout(() => {
        setStreamState("streaming");
      }, 2500);
      return () => window.clearTimeout(timer);
    }

    const container = streamContainerRef.current;
    const session = createPixelStreamingSession({
      container,
      onStateChange: (nextState) => {
        setStreamState(nextState);
        if (nextState !== "error") {
          setStreamError("");
        }
        if (nextState === "streaming") {
          container.focus?.();
        }
      },
      onError: () => {
        setStreamError("Unable to establish the Pixel Streaming session.");
      },
      onStats: (aggregatedStats) => {
        if (!aggregatedStats) {
          return;
        }
        const inboundVideo = aggregatedStats.inboundVideoStats || {};
        setMetrics((prev) => {
          const packetsLost = inboundVideo.packetsLost || 0;
          const packetsReceived = inboundVideo.packetsReceived || 0;
          const totalPackets = packetsLost + packetsReceived;
          const packetLoss = totalPackets
            ? ((packetsLost / totalPackets) * 100).toFixed(1)
            : prev.packetLoss;
          let bitrate = prev.bitrate;
          if (inboundVideo.bitrate && inboundVideo.bitrate > 0) {
            bitrate = (inboundVideo.bitrate / 1000000).toFixed(1);
          } else if (
            typeof inboundVideo.bytesReceived === "number" &&
            typeof inboundVideo.timestamp === "number"
          ) {
            const lastBytes = statsHistoryRef.current.bytesReceived;
            const lastTimestamp = statsHistoryRef.current.timestamp;
            if (
              typeof lastBytes === "number" &&
              typeof lastTimestamp === "number"
            ) {
              const deltaBytes = inboundVideo.bytesReceived - lastBytes;
              const deltaMs = inboundVideo.timestamp - lastTimestamp;
              if (deltaBytes > 0 && deltaMs > 0) {
                const computedMbps =
                  (deltaBytes * 8) / (deltaMs / 1000) / 1000000;
                if (Number.isFinite(computedMbps)) {
                  bitrate = computedMbps.toFixed(1);
                }
              }
            }
            statsHistoryRef.current = {
              bytesReceived: inboundVideo.bytesReceived,
              timestamp: inboundVideo.timestamp,
            };
          }
          const fps = inboundVideo.framesPerSecond
            ? `${Math.round(inboundVideo.framesPerSecond)}`
            : prev.fps;
          const frameWidth = inboundVideo.frameWidth;
          const frameHeight = inboundVideo.frameHeight;
          const resolution =
            frameWidth && frameHeight
              ? `${frameWidth}×${frameHeight}`
              : prev.resolution;

          return {
            ...prev,
            bitrate,
            packetLoss,
            fps,
            resolution,
          };
        });
      },
    });

    sessionRef.current = session;

    const handleContainerPointerDown = () => {
      sessionRef.current?.requestPointerLock?.();
    };
    container.addEventListener("pointerdown", handleContainerPointerDown);

    return () => {
      container.removeEventListener("pointerdown", handleContainerPointerDown);
      sessionRef.current?.destroy();
      sessionRef.current = null;
    };
  }, [experience?.requiresAccess]);

  useEffect(() => {
    const handleWindowResize = () => {
      sessionRef.current?.refreshViewport?.();
    };

    window.addEventListener("resize", handleWindowResize);
    return () => window.removeEventListener("resize", handleWindowResize);
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

  useEffect(() => {
    const resetIdleTimer = () => {
      setUiVisible(true);
      if (idleTimerRef.current) {
        window.clearTimeout(idleTimerRef.current);
      }
      if (phase !== "ready" || showExitConfirm) {
        return;
      }
      idleTimerRef.current = window.setTimeout(() => {
        setUiVisible(false);
      }, 2500);
    };

    const revealControlsFromPointer = (event) => {
      const edgeZone = 90;
      const nearTop = event.clientY <= edgeZone;
      const nearBottom = window.innerHeight - event.clientY <= edgeZone;

      if (nearTop || nearBottom) {
        resetIdleTimer();
      }
    };

    resetIdleTimer();

    const keyboardAndTouchEvents = ["touchstart", "keydown"];
    keyboardAndTouchEvents.forEach((eventName) =>
      window.addEventListener(eventName, resetIdleTimer),
    );
    window.addEventListener("pointermove", revealControlsFromPointer);

    return () => {
      if (idleTimerRef.current) {
        window.clearTimeout(idleTimerRef.current);
      }
      keyboardAndTouchEvents.forEach((eventName) =>
        window.removeEventListener(eventName, resetIdleTimer),
      );
      window.removeEventListener("pointermove", revealControlsFromPointer);
    };
  }, [phase, showExitConfirm]);

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

  const toggleInputFlag = (key, enabled) => {
    setInputSettings((prev) => ({
      ...prev,
      [key]: enabled,
    }));

    if (!sessionRef.current?.setFlagEnabled) {
      return;
    }

    const flagMap = {
      mouse: "MouseInput",
      keyboard: "KeyboardInput",
      touch: "TouchInput",
      fakeMouseWithTouches: "FakeMouseWithTouches",
    };

    const flagName = flagMap[key];
    if (!flagName) {
      return;
    }
    sessionRef.current.setFlagEnabled(flagName, enabled);
  };

  const setMouseMode = (mode) => {
    const hoveringMouse = mode === "hover";
    setInputSettings((prev) => ({
      ...prev,
      hoveringMouse,
    }));
    sessionRef.current?.setMouseMode?.(mode);
  };

  const showShell =
    phase === "loading" ||
    streamState === "error" ||
    streamState === "reconnecting";

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink text-sand">
      <div className="absolute inset-0 z-0 bg-black" />
      <div className="absolute inset-0 z-0">
        <div
          ref={streamContainerRef}
          tabIndex={0}
          className="h-full w-full [&_video]:h-full [&_video]:w-full [&_video]:object-cover"
        />
      </div>
      <div
        className={`pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-ink/65 via-ink/45 to-ink/80 transition-opacity duration-500 ${
          showShell ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        className={`pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_top,#2b2621,transparent_70%)] transition-opacity duration-500 ${
          showShell ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        className={`pointer-events-none absolute right-0 top-0 z-0 h-64 w-64 rounded-full bg-brand/20 blur-3xl transition-opacity duration-500 ${
          showShell ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        className={`pointer-events-none absolute bottom-0 left-10 z-0 h-72 w-72 rounded-full bg-rose/20 blur-3xl transition-opacity duration-500 ${
          showShell ? "opacity-100" : "opacity-0"
        }`}
      />

      <div
        className="pointer-events-none relative z-10 h-screen select-none px-6 md:px-12"
        style={{ cursor: uiVisible || showExitConfirm ? "default" : "none" }}
      >
        {isPortrait ? (
          <div className="pointer-events-none absolute left-6 right-6 top-4 z-30 md:left-12 md:right-12">
            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-xs text-sand/80">
              Rotate your device for the best experience.
            </div>
          </div>
        ) : null}

        <main className="pointer-events-none flex h-full flex-col items-center justify-center text-center py-8 md:py-10">
          <AnimatePresence mode="wait">
            {showShell ? (
              <motion.div
                key="loading"
                className="space-y-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-white/15 bg-white/5">
                  <div className="animate-spin-reverse">
                    <RotateCcw className="h-6 w-6" />
                  </div>
                </div>
                <p className="text-lg font-semibold text-sand">
                  {streamStateMessages[streamState] ||
                    "Preparing the experience..."}
                </p>
                <p className="text-sm text-sand/70">
                  {streamError ||
                    "Syncing assets, booting the session, and checking network conditions."}
                </p>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </main>

        <AnimatePresence>
          {uiVisible || showExitConfirm ? (
            <motion.header
              className="pointer-events-none absolute left-0 right-0 top-6 z-20 px-6 md:px-12"
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
            >
              <div className="pointer-events-auto flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/20 bg-ink/75 px-4 py-3 backdrop-blur-md">
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
                    {streamState === "streaming" ? "Live" : "Session loading"}
                  </span>
                  <span className="hidden sm:inline">
                    User: {user?.email || "Guest"}
                  </span>
                </div>
              </div>
            </motion.header>
          ) : null}
        </AnimatePresence>

        <AnimatePresence>
          {uiVisible || showExitConfirm ? (
            <motion.footer
              className="pointer-events-none absolute bottom-6 left-0 right-0 z-20 px-6 md:px-12"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.3 }}
            >
              <div className="pointer-events-auto space-y-4 rounded-2xl border border-white/20 bg-ink/75 p-4 backdrop-blur-md">
                {!isFullscreen ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-xs text-sand/70">
                    <span>Not in fullscreen mode.</span>
                    <button
                      type="button"
                      onClick={() =>
                        document.documentElement
                          .requestFullscreen?.()
                          .catch(() => {})
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
                    <IconButton
                      label="Quit"
                      tone="danger"
                      onClick={handleQuitClick}
                    >
                      <LogOut className={iconClasses} />
                    </IconButton>
                    <IconButton
                      label="Settings"
                      onClick={() => setShowSettingsPanel((prev) => !prev)}
                    >
                      <Settings className={iconClasses} />
                    </IconButton>
                    <IconButton
                      label="Metrics"
                      onClick={() => setShowMetrics((prev) => !prev)}
                    >
                      <BarChart3 className={iconClasses} />
                    </IconButton>
                    <IconButton
                      label="Report"
                      onClick={() =>
                        window.alert("Reporting is not available yet.")
                      }
                    >
                      <Flag className={iconClasses} />
                    </IconButton>
                  </div>
                  <div className="text-xs text-sand/60">
                    Resolution {metrics.resolution} · Latency {metrics.latency}
                    ms · Region eu-west-2
                  </div>
                </div>

                {showMetrics ? (
                  <div className="grid gap-3 rounded-2xl border border-white/15 bg-white/5 px-4 py-4 text-xs text-sand/80 sm:grid-cols-3">
                    <div>
                      <p className="uppercase tracking-[0.2em] text-sand/50">
                        Bandwidth
                      </p>
                      <p className="mt-1 text-sm font-semibold text-sand">
                        {metrics.bitrate} Mbps
                      </p>
                    </div>
                    <div>
                      <p className="uppercase tracking-[0.2em] text-sand/50">
                        Packet loss
                      </p>
                      <p className="mt-1 text-sm font-semibold text-sand">
                        {metrics.packetLoss}%
                      </p>
                    </div>
                    <div>
                      <p className="uppercase tracking-[0.2em] text-sand/50">
                        FPS
                      </p>
                      <p className="mt-1 text-sm font-semibold text-sand">
                        {metrics.fps} fps
                      </p>
                    </div>
                  </div>
                ) : null}

                {showSettingsPanel ? (
                  <div className="grid gap-3 rounded-2xl border border-white/15 bg-white/5 px-4 py-4 text-xs text-sand/80 sm:grid-cols-2">
                    <label className="flex items-center justify-between gap-3">
                      <span>Mouse input</span>
                      <input
                        type="checkbox"
                        checked={inputSettings.mouse}
                        onChange={(event) =>
                          toggleInputFlag("mouse", event.target.checked)
                        }
                      />
                    </label>
                    <label className="flex items-center justify-between gap-3">
                      <span>Keyboard input</span>
                      <input
                        type="checkbox"
                        checked={inputSettings.keyboard}
                        onChange={(event) =>
                          toggleInputFlag("keyboard", event.target.checked)
                        }
                      />
                    </label>
                    <label className="flex items-center justify-between gap-3">
                      <span>Touch input</span>
                      <input
                        type="checkbox"
                        checked={inputSettings.touch}
                        onChange={(event) =>
                          toggleInputFlag("touch", event.target.checked)
                        }
                      />
                    </label>
                    <label className="flex items-center justify-between gap-3">
                      <span>Fake mouse with touches</span>
                      <input
                        type="checkbox"
                        checked={inputSettings.fakeMouseWithTouches}
                        onChange={(event) =>
                          toggleInputFlag(
                            "fakeMouseWithTouches",
                            event.target.checked,
                          )
                        }
                      />
                    </label>
                    <div className="sm:col-span-2 flex flex-wrap items-center gap-2">
                      <span className="mr-2">Mouse mode:</span>
                      <button
                        type="button"
                        onClick={() => setMouseMode("locked")}
                        className={`rounded-full border px-3 py-1 ${
                          !inputSettings.hoveringMouse
                            ? "border-brand bg-brand/20"
                            : "border-white/20"
                        }`}
                      >
                        Locked
                      </button>
                      <button
                        type="button"
                        onClick={() => setMouseMode("hover")}
                        className={`rounded-full border px-3 py-1 ${
                          inputSettings.hoveringMouse
                            ? "border-brand bg-brand/20"
                            : "border-white/20"
                        }`}
                      >
                        Hover
                      </button>
                    </div>
                  </div>
                ) : null}

                <div className="text-xs text-sand/50">
                  Tip: move cursor near top/bottom edge to reveal controls.
                </div>
              </div>
            </motion.footer>
          ) : null}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showExitConfirm ? (
          <motion.div
            className="absolute inset-0 z-30 flex items-center justify-center bg-ink/70 px-6 text-sand"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-md rounded-3xl border border-white/15 bg-ink/90 p-6 text-center shadow-soft"
              initial={{ scale: 0.96, y: 12, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.96, y: 12, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
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
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
