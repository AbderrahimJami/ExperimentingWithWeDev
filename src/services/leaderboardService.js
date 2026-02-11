const STORAGE_KEY = "wedev:leaderboard:v1";

// Configure leaderboards per experience.
const LEADERBOARD_CONFIG_BY_EXPERIENCE = {
  // Orbital Drift
  "exp-1": [
    { id: "overall", label: "Overall" },
    { id: "speedrun", label: "Speedrun" },
    { id: "weekly", label: "Weekly" },
  ],
};

const MOCK_LEADERBOARD = {
  "exp-1": {
    overall: [
      { username: "NovaRunner", finalScore: 9620 },
      { username: "PixelAce", finalScore: 9310 },
      { username: "SkyForge", finalScore: 9025 },
      { username: "EchoPilot", finalScore: 8870 },
      { username: "QuantumFox", finalScore: 8515 },
    ],
    speedrun: [
      { username: "ByteDash", finalScore: 11040 },
      { username: "RunLoop", finalScore: 10420 },
      { username: "NovaRunner", finalScore: 10090 },
      { username: "ArcLight", finalScore: 9820 },
    ],
    weekly: [
      { username: "WeekOne", finalScore: 4480 },
      { username: "Cobalt", finalScore: 4300 },
      { username: "Sora", finalScore: 4195 },
    ],
  },
};

function getLeaderboardStorageKey(experienceId, leaderboardId) {
  return `${experienceId}::${leaderboardId}`;
}

function normalizeLeaderboardId(experienceId, leaderboardId) {
  const options = LEADERBOARD_CONFIG_BY_EXPERIENCE[experienceId] || [];
  if (!options.length) {
    return "";
  }

  if (leaderboardId && options.some((option) => option.id === leaderboardId)) {
    return leaderboardId;
  }

  return options[0].id;
}

function safeReadStorage() {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    return {};
  }
}

function safeWriteStorage(value) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch (error) {
    // Ignore storage write failures and keep app usable.
  }
}

function normalizeLeaderboardRows(rows) {
  if (!Array.isArray(rows)) {
    return [];
  }

  return rows
    .map((row) => ({
      username: String(row.username || "").trim() || "Player",
      finalScore: Number(row.finalScore) || 0,
    }))
    .sort((a, b) => b.finalScore - a.finalScore)
    .slice(0, 20);
}

function ensureExperienceSeed(experienceId, leaderboardId, storageState) {
  const nextState = { ...storageState };
  const storageKey = getLeaderboardStorageKey(experienceId, leaderboardId);

  if (!nextState[storageKey]) {
    const mockRows = MOCK_LEADERBOARD[experienceId]?.[leaderboardId] || [];

    // Backward compatibility for old shape: { "exp-1": [...] }
    const legacyRows =
      leaderboardId === normalizeLeaderboardId(experienceId)
        ? nextState[experienceId]
        : null;

    nextState[storageKey] = Array.isArray(legacyRows) ? legacyRows : mockRows;
    safeWriteStorage(nextState);
  }

  return nextState;
}

export function getLeaderboardOptionsForExperience(experienceId) {
  return LEADERBOARD_CONFIG_BY_EXPERIENCE[experienceId] || [];
}

export function isLeaderboardEnabledForExperience(experienceId) {
  return getLeaderboardOptionsForExperience(experienceId).length > 0;
}

export async function getExperienceLeaderboard(experienceId, leaderboardId) {
  if (!experienceId) {
    return [];
  }

  const resolvedLeaderboardId = normalizeLeaderboardId(
    experienceId,
    leaderboardId,
  );

  if (!resolvedLeaderboardId) {
    return [];
  }

  const storageState = ensureExperienceSeed(
    experienceId,
    resolvedLeaderboardId,
    safeReadStorage(),
  );

  return normalizeLeaderboardRows(
    storageState[getLeaderboardStorageKey(experienceId, resolvedLeaderboardId)],
  );
}

export async function submitMockLeaderboardScore({
  experienceId,
  leaderboardId,
  username,
  finalScore,
}) {
  if (!experienceId) {
    return [];
  }

  const resolvedLeaderboardId = normalizeLeaderboardId(
    experienceId,
    leaderboardId,
  );

  if (!resolvedLeaderboardId) {
    return [];
  }

  const storageKey = getLeaderboardStorageKey(experienceId, resolvedLeaderboardId);
  const storageState = ensureExperienceSeed(
    experienceId,
    resolvedLeaderboardId,
    safeReadStorage(),
  );
  const current = normalizeLeaderboardRows(storageState[storageKey]);
  const safeUsername = String(username || "").trim() || "Player";
  const safeScore = Math.max(0, Number(finalScore) || 0);

  const existingIndex = current.findIndex(
    (entry) => entry.username.toLowerCase() === safeUsername.toLowerCase(),
  );

  if (existingIndex >= 0) {
    current[existingIndex] = {
      ...current[existingIndex],
      finalScore: Math.max(current[existingIndex].finalScore, safeScore),
    };
  } else {
    current.push({ username: safeUsername, finalScore: safeScore });
  }

  const nextRows = normalizeLeaderboardRows(current);
  safeWriteStorage({
    ...storageState,
    [storageKey]: nextRows,
  });

  return nextRows;
}
