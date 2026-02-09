const STORAGE_KEY = "wedev:leaderboard:v1";

// Toggle leaderboard availability per experience here.
const LEADERBOARD_ENABLED_EXPERIENCE_IDS = new Set(["exp-1"]);

const MOCK_LEADERBOARD = {
  "exp-1": [
    { username: "NovaRunner", finalScore: 9620 },
    { username: "PixelAce", finalScore: 9310 },
    { username: "SkyForge", finalScore: 9025 },
    { username: "EchoPilot", finalScore: 8870 },
    { username: "QuantumFox", finalScore: 8515 },
  ],
};

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

function ensureExperienceSeed(experienceId, storageState) {
  const nextState = { ...storageState };
  if (!nextState[experienceId]) {
    nextState[experienceId] = MOCK_LEADERBOARD[experienceId] || [];
    safeWriteStorage(nextState);
  }
  return nextState;
}

export function isLeaderboardEnabledForExperience(experienceId) {
  return LEADERBOARD_ENABLED_EXPERIENCE_IDS.has(experienceId);
}

export async function getExperienceLeaderboard(experienceId) {
  if (!experienceId) {
    return [];
  }

  const storageState = ensureExperienceSeed(experienceId, safeReadStorage());
  return normalizeLeaderboardRows(storageState[experienceId]);
}

export async function submitMockLeaderboardScore({
  experienceId,
  username,
  finalScore,
}) {
  if (!experienceId) {
    return [];
  }

  const storageState = ensureExperienceSeed(experienceId, safeReadStorage());
  const current = normalizeLeaderboardRows(storageState[experienceId]);
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
    [experienceId]: nextRows,
  });

  return nextRows;
}
