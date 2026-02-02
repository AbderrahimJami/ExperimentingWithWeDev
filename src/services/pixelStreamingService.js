import {
  Config,
  Flags,
  PixelStreaming,
  TextParameters,
} from "@epicgames-ps/lib-pixelstreamingfrontend-ue5.6";

export const isPixelStreamingConfigured = Boolean(
  import.meta.env.VITE_PIXEL_STREAMING_URL
);

export function createPixelStreamingSession({
  container,
  signallingServerUrl = import.meta.env.VITE_PIXEL_STREAMING_URL,
  onStateChange,
  onStats,
  onError,
}) {
  if (!container || !signallingServerUrl) {
    return null;
  }

  const config = new Config({
    useUrlParams: true,
    initialSettings: {
      [TextParameters.SignallingServerUrl]: signallingServerUrl,
      [Flags.AutoConnect]: false,
      [Flags.AutoPlayVideo]: true,
      [Flags.WaitForStreamer]: true,
      [Flags.MatchViewportResolution]: true,
      [Flags.SuppressBrowserKeys]: true,
      [Flags.MouseInput]: true,
      [Flags.KeyboardInput]: true,
      [Flags.TouchInput]: true,
      [Flags.HoveringMouseMode]: false,
      [Flags.FakeMouseWithTouches]: false,
    },
  });

  const pixelStreaming = new PixelStreaming(config, {
    videoElementParent: container,
  });

  const listeners = [];
  const addListener = (type, handler) => {
    pixelStreaming.addEventListener(type, handler);
    listeners.push({ type, handler });
  };

  addListener("streamLoading", () => onStateChange?.("booting"));
  addListener("streamConnect", () => onStateChange?.("connecting"));
  addListener("webRtcConnecting", () => onStateChange?.("connecting"));
  addListener("webRtcConnected", () => onStateChange?.("connected"));
  addListener("videoInitialized", () => onStateChange?.("streaming"));
  addListener("playStream", () => onStateChange?.("streaming"));
  addListener("streamReconnect", () => onStateChange?.("reconnecting"));
  addListener("statsReceived", (event) =>
    onStats?.(event.data?.aggregatedStats || null)
  );

  const handleErrorState = (error) => {
    onStateChange?.("error");
    onError?.(error);
  };

  addListener("webRtcFailed", handleErrorState);
  addListener("webRtcDisconnected", handleErrorState);
  addListener("subscribeFailed", handleErrorState);
  addListener("playStreamError", handleErrorState);

  onStateChange?.("connecting");
  pixelStreaming.connect();

  const setFlagEnabled = (flag, enabled) => {
    config.setFlagEnabled(flag, Boolean(enabled));
  };

  const setMouseMode = (mode) => {
    // false => locked mouse mode, true => hovering mode.
    config.setFlagEnabled(Flags.HoveringMouseMode, mode === "hover");
  };

  const requestPointerLock = () => {
    if (!config.isFlagEnabled(Flags.HoveringMouseMode)) {
      container.requestPointerLock?.();
    }
  };

  const refreshViewport = () => {
    window.dispatchEvent(new Event("resize"));
  };

  return {
    pixelStreaming,
    config,
    setFlagEnabled,
    setMouseMode,
    requestPointerLock,
    refreshViewport,
    destroy() {
      listeners.forEach(({ type, handler }) => {
        pixelStreaming.removeEventListener(type, handler);
      });
      pixelStreaming.disconnect();
      container.innerHTML = "";
    },
  };
}
