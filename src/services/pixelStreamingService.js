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
      MaxReconnectAttempts: 999,
      StreamerAutoJoinInterval: 2000,
    },
  });

  const pixelStreaming = new PixelStreaming(config, {
    videoElementParent: container,
  });

  let isDestroyed = false;
  let isStreaming = false;
  let reconnectTimer = null;
  let healthTimer = null;
  let reconnectAttempts = 0;
  let lastStatsAt = 0;

  const reconnectIntervalMs =
    Number(import.meta.env.VITE_PIXEL_STREAMING_RETRY_MS) || 2500;
  const maxReconnectAttempts =
    Number(import.meta.env.VITE_PIXEL_STREAMING_MAX_RETRIES) || 0;
  const streamHealthTimeoutMs =
    Number(import.meta.env.VITE_PIXEL_STREAMING_HEALTH_TIMEOUT_MS) || 8000;
  const healthCheckIntervalMs =
    Number(import.meta.env.VITE_PIXEL_STREAMING_HEALTH_CHECK_MS) || 1500;

  const listeners = [];
  const addListener = (type, handler) => {
    pixelStreaming.addEventListener(type, handler);
    listeners.push({ type, handler });
  };

  const clearReconnectTimer = () => {
    if (reconnectTimer) {
      window.clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };

  const clearHealthTimer = () => {
    if (healthTimer) {
      window.clearInterval(healthTimer);
      healthTimer = null;
    }
  };

  const canRetry = () =>
    maxReconnectAttempts <= 0 || reconnectAttempts < maxReconnectAttempts;

  const beginReconnectLoop = (reason) => {
    if (isDestroyed || isStreaming || reconnectTimer) {
      return;
    }

    onStateChange?.("reconnecting");

    const tryReconnect = () => {
      if (isDestroyed || isStreaming) {
        clearReconnectTimer();
        return;
      }

      if (!canRetry()) {
        onStateChange?.("error");
        onError?.(
          new Error(
            reason ||
              "Unable to recover the Pixel Streaming session after multiple retries.",
          ),
        );
        clearReconnectTimer();
        return;
      }

      reconnectAttempts += 1;

      try {
        if (typeof pixelStreaming.reconnect === "function") {
          pixelStreaming.reconnect();
        } else {
          pixelStreaming.connect();
        }
      } catch (error) {
        // Keep retry loop alive; some reconnect attempts can fail transiently.
      }

      reconnectTimer = window.setTimeout(() => {
        reconnectTimer = null;
        tryReconnect();
      }, reconnectIntervalMs);
    };

    tryReconnect();
  };

  const markStreaming = () => {
    isStreaming = true;
    reconnectAttempts = 0;
    lastStatsAt = Date.now();
    clearReconnectTimer();
    onStateChange?.("streaming");
  };

  const startHealthMonitor = () => {
    clearHealthTimer();
    healthTimer = window.setInterval(() => {
      if (isDestroyed || !isStreaming) {
        return;
      }

      const now = Date.now();
      if (now - lastStatsAt > streamHealthTimeoutMs) {
        isStreaming = false;
        beginReconnectLoop("Stream heartbeat lost.");
      }
    }, healthCheckIntervalMs);
  };

  addListener("streamLoading", () => onStateChange?.("booting"));
  addListener("streamConnect", () => onStateChange?.("connecting"));
  addListener("webRtcAutoConnect", () => onStateChange?.("connecting"));
  addListener("webRtcConnecting", () => onStateChange?.("connecting"));
  addListener("webRtcConnected", () => onStateChange?.("connected"));
  addListener("videoInitialized", markStreaming);
  addListener("playStream", markStreaming);
  addListener("streamReconnect", () => {
    isStreaming = false;
    onStateChange?.("reconnecting");
  });
  addListener("streamDisconnect", () => {
    isStreaming = false;
    beginReconnectLoop("Stream disconnected.");
  });
  addListener("dataChannelClose", () => {
    isStreaming = false;
    beginReconnectLoop("Data channel closed.");
  });
  addListener("statsReceived", (event) =>
    {
      lastStatsAt = Date.now();
      onStats?.(event.data?.aggregatedStats || null);
    });

  const handleRetryableDisconnect = (event) => {
    isStreaming = false;
    const allowClickToReconnect = event?.data?.allowClickToReconnect;
    const reason = event?.data?.eventString || "WebRTC disconnected.";

    if (allowClickToReconnect === false) {
      onStateChange?.("reconnecting");
      return;
    }

    beginReconnectLoop(reason);
  };

  addListener("webRtcDisconnected", handleRetryableDisconnect);
  addListener("webRtcFailed", () =>
    beginReconnectLoop("WebRTC failed to connect."),
  );
  addListener("subscribeFailed", (event) =>
    beginReconnectLoop(event?.data?.message || "Failed to subscribe to stream."),
  );
  addListener("playStreamError", (event) =>
    beginReconnectLoop(event?.data?.message || "Failed to start stream playback."),
  );

  onStateChange?.("connecting");
  lastStatsAt = Date.now();
  startHealthMonitor();
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
    reconnect() {
      beginReconnectLoop("Manual reconnect requested.");
    },
    destroy() {
      isDestroyed = true;
      isStreaming = false;
      clearReconnectTimer();
      clearHealthTimer();
      listeners.forEach(({ type, handler }) => {
        pixelStreaming.removeEventListener(type, handler);
      });
      pixelStreaming.disconnect();
      container.innerHTML = "";
    },
  };
}
