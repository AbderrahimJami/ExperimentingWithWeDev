import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Button from "../components/Button";
import DashboardSkeleton from "../components/DashboardSkeleton";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  fetchExperiencesForUser,
  isCatalogConfigured,
} from "../services/catalogService";

const statusStyles = {
  available: "border-brand/90 bg-brand/85 text-ink",
  locked: "border-rose/90 bg-rose/85 text-ink",
  beta: "border-sun/90 bg-sun/85 text-ink",
};

const formatStatusLabel = (status) => {
  if (!status) {
    return "Available";
  }
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const normalizeExperience = (experience) => {
  const minUsers =
    experience.minUsers ??
    experience.min_users ??
    experience.minimumUsers ??
    null;
  const maxUsers =
    experience.maxUsers ??
    experience.max_users ??
    experience.maximumUsers ??
    null;
  const usersRequired =
    minUsers && maxUsers
      ? `${minUsers}-${maxUsers}`
      : experience.usersRequired ||
        experience.users_required ||
        experience.users ||
        "";
  const avgTime =
    experience.avgTimeMinutes || experience.avgTime || experience.avg_time || "";
  const avgTimeLabel = avgTime
    ? typeof avgTime === "number"
      ? `${avgTime} min`
      : avgTime
    : "";
  const hasAccess =
    experience.hasAccess !== undefined
      ? experience.hasAccess
      : experience.status !== "locked";
  const status = experience.status || (hasAccess ? "available" : "locked");

  return {
    id: experience.id,
    title: experience.title,
    description: experience.description,
    imageUrl: experience.imageUrl || experience.imagePath || experience.image || "",
    avgTime: avgTimeLabel,
    usersRequired,
    hardware: experience.hardware || "",
    tags: experience.tags || [],
    status,
    statusLabel: experience.statusLabel || formatStatusLabel(status),
    requiresAccess: !hasAccess,
    lockReason: experience.lockReason || experience.lock_reason || "",
    cta: hasAccess ? "Launch" : "Request access",
  };
};

const metaItems = (experience) =>
  [
    { label: "Avg time", value: experience.avgTime },
    { label: "Users", value: experience.usersRequired },
    { label: "Hardware", value: experience.hardware },
  ].filter((item) => item.value);

function ExperienceTags({ tags }) {
  if (!tags || !tags.length) {
    return null;
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {tags.map((tag) => (
        <span
          key={tag}
          className="rounded-full border border-ink/10 bg-white/80 px-3 py-1 text-xs font-semibold text-slate"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

function ExperienceImage({ imageUrl, alt }) {
  if (imageUrl) {
    return (
      <img src={imageUrl} alt={alt} className="h-full w-full object-cover" />
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sand via-mist to-clay text-xs font-semibold uppercase tracking-[0.3em] text-slate/70">
      Preview
    </div>
  );
}

function ExperienceCard({ experience, onAction, onDetails }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/60 bg-white/85 shadow-soft backdrop-blur">
      <div className="relative h-44">
        <ExperienceImage imageUrl={experience.imageUrl} alt={experience.title} />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
        <span
          className={`absolute left-4 top-4 rounded-full border px-3 py-1 text-xs font-semibold ${
            statusStyles[experience.status] || statusStyles.available
          }`}
        >
          {experience.statusLabel}
        </span>
      </div>
      <div className="space-y-4 p-5">
        <div>
          <h3 className="font-display text-xl text-ink">{experience.title}</h3>
          <p className="mt-2 text-sm text-slate">{experience.description}</p>
        </div>
        <div className="grid gap-3 text-xs text-slate sm:grid-cols-3">
          {metaItems(experience).map((item) => (
            <div key={item.label}>
              <p className="uppercase tracking-[0.2em] text-[0.55rem] text-slate/70">
                {item.label}
              </p>
              <p className="mt-1 text-sm font-semibold text-ink">
                {item.value}
              </p>
            </div>
          ))}
        </div>
        <ExperienceTags tags={experience.tags} />
        {experience.lockReason ? (
          <p className="text-xs text-rose">{experience.lockReason}</p>
        ) : null}
        <div className="flex items-center gap-3">
          <Button onClick={() => onAction(experience)}>{experience.cta}</Button>
          <Button
            variant="secondary"
            type="button"
            onClick={() => onDetails(experience)}
          >
            Details
          </Button>
        </div>
      </div>
    </div>
  );
}

function ExperienceSpotlight({ experience, onAction, onDetails }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/60 bg-white/85 shadow-soft backdrop-blur">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="relative min-h-[260px]">
          <ExperienceImage imageUrl={experience.imageUrl} alt={experience.title} />
          <div className="absolute inset-0 bg-gradient-to-r from-ink/75 via-ink/20 to-transparent" />
          <div className="absolute bottom-6 left-6 space-y-2">
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                statusStyles[experience.status] || statusStyles.available
              }`}
            >
              {experience.statusLabel}
            </span>
            <p className="text-xs uppercase tracking-[0.3em] text-sand/70">
              Featured experience
            </p>
            <h2 className="font-display text-3xl text-sand">
              {experience.title}
            </h2>
          </div>
        </div>
        <div className="space-y-4 p-6">
          <p className="text-sm text-slate">{experience.description}</p>
          <div className="grid gap-4 text-xs text-slate sm:grid-cols-3">
            {metaItems(experience).map((item) => (
              <div key={item.label}>
                <p className="uppercase tracking-[0.2em] text-[0.55rem] text-slate/70">
                  {item.label}
                </p>
                <p className="mt-1 text-sm font-semibold text-ink">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
          <ExperienceTags tags={experience.tags} />
          {experience.lockReason ? (
            <p className="text-xs text-rose">{experience.lockReason}</p>
          ) : null}
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => onAction(experience)}>
              {experience.cta}
            </Button>
            <Button
              variant="secondary"
              type="button"
              onClick={() => onDetails(experience)}
            >
              Details
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, signOut } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [showLocked, setShowLocked] = useState(false);
  const catalogEnabled = isCatalogConfigured;
  const {
    data: items = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["experiences", user?.email],
    queryFn: fetchExperiencesForUser,
    enabled: catalogEnabled,
  });

  const errorMessage = !catalogEnabled
    ? "Catalog API not configured. Set VITE_APPSYNC_ENDPOINT and VITE_APPSYNC_REGION."
    : isError
      ? "Unable to load experiences. Check AppSync configuration."
      : "";

  const normalizedExperiences = useMemo(
    () => items.map((experience) => normalizeExperience(experience)),
    [items]
  );

  const { totalCount, accessibleCount, lockedCount } = useMemo(() => {
    const accessible = normalizedExperiences.filter(
      (experience) => !experience.requiresAccess
    ).length;
    return {
      totalCount: normalizedExperiences.length,
      accessibleCount: accessible,
      lockedCount: normalizedExperiences.length - accessible,
    };
  }, [normalizedExperiences]);

  const filteredExperiences = useMemo(() => {
    if (showLocked) {
      return normalizedExperiences;
    }
    return normalizedExperiences.filter(
      (experience) => !experience.requiresAccess
    );
  }, [normalizedExperiences, showLocked]);

  const emptyMessage = showLocked
    ? "No experiences match this view yet. Try again later."
    : lockedCount
      ? "No unlocked experiences yet. Toggle show locked to browse the catalog."
      : "No experiences available yet. Check back soon.";

  const spotlight = filteredExperiences[0];
  const gridExperiences = filteredExperiences.filter(
    (experience) => experience.id !== spotlight?.id
  );

  const handleSignOut = async () => {
    try {
      await signOut();
      addToast({ message: "Signed out successfully.", tone: "info" });
    } catch (error) {
      addToast({
        message: "Sign out failed. Please try again.",
        tone: "error",
      });
    }
  };

  const handleAction = (experience) => {
    if (experience.requiresAccess) {
      addToast({
        message: `Access requested for ${experience.title}.`,
        tone: "info",
      });
      return;
    }

    addToast({
      message: `Launching ${experience.title}...`,
      tone: "success",
    });
  };

  const handleDetails = (experience) => {
    navigate(`/experiences/${experience.id}`);
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate">
            Dashboard
          </p>
          <h1 className="mt-2 font-display text-3xl text-ink">
            Experience catalogue
          </h1>
          <p className="mt-3 text-slate">
            Welcome back{user?.email ? `, ${user.email}` : ""}. Choose an
            experience to launch or request access.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-2xl border border-white/60 bg-white/70 px-4 py-2 text-xs text-slate">
            {showLocked ? totalCount : accessibleCount} experiences
          </div>
          <Button as={Link} to="/settings" variant="secondary">
            Settings
          </Button>
          <Button onClick={handleSignOut}>Sign out</Button>
        </div>
      </div>

      {errorMessage ? (
        <div className="mt-8 rounded-3xl border border-rose/30 bg-rose/10 px-6 py-4 text-sm text-rose">
          {errorMessage}
        </div>
      ) : null}

      {isLoading ? <DashboardSkeleton /> : null}

      {!isLoading ? (
        <>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-3 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-xs font-semibold text-slate">
              <input
                type="checkbox"
                className="h-4 w-4 accent-ink"
                checked={showLocked}
                onChange={(event) => setShowLocked(event.target.checked)}
              />
              Show locked experiences
            </label>
            {lockedCount ? (
              <span className="text-xs text-slate">
                {showLocked
                  ? `${lockedCount} locked`
                  : `${lockedCount} locked hidden`}
              </span>
            ) : null}
          </div>

          <div className="mt-8 space-y-10">
            {spotlight ? (
              <ExperienceSpotlight
                experience={spotlight}
                onAction={handleAction}
                onDetails={handleDetails}
              />
            ) : null}

            {gridExperiences.length ? (
              <div className="grid gap-6 md:grid-cols-2">
                {gridExperiences.map((experience) => (
                  <ExperienceCard
                    key={experience.id}
                    experience={experience}
                    onAction={handleAction}
                    onDetails={handleDetails}
                  />
                ))}
              </div>
            ) : null}

            {!filteredExperiences.length && !errorMessage ? (
              <div className="rounded-3xl border border-white/60 bg-white/80 px-6 py-10 text-center text-sm text-slate shadow-soft">
                {emptyMessage}
              </div>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
