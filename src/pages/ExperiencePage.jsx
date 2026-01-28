import { useMemo } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import Button from "../components/Button";
import ExperienceSkeleton from "../components/ExperienceSkeleton";
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
    experience.avgTimeMinutes ||
    experience.avgTime ||
    experience.avg_time ||
    "";
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
    imageUrl:
      experience.imageUrl || experience.imagePath || experience.image || "",
    avgTime: avgTimeLabel,
    usersRequired,
    hardware: experience.hardware || "",
    tags: experience.tags || [],
    status,
    statusLabel: experience.statusLabel || formatStatusLabel(status),
    requiresAccess: !hasAccess,
    lockReason: experience.lockReason || experience.lock_reason || "",
    cta: hasAccess ? "Launch experience" : "Request access",
    trailerUrl: experience.trailerUrl || experience.trailer || "",
  };
};

const buildHighlights = (experience) => {
  const highlights = [
    experience.avgTime ? `Average session: ${experience.avgTime}` : "",
    experience.usersRequired
      ? `Best with ${experience.usersRequired} players`
      : "",
    experience.hardware ? `Optimized for ${experience.hardware}` : "",
  ];

  if (experience.tags && experience.tags.length) {
    highlights.push(`Themes: ${experience.tags.slice(0, 3).join(", ")}`);
  }

  return highlights.filter(Boolean).slice(0, 4);
};

const buildRequirements = (experience) => {
  const requirements = [
    experience.hardware ? `Supported hardware: ${experience.hardware}.` : "",
    "Stable broadband connection recommended.",
    "Chrome, Edge, or Safari (latest).",
    "Headphones recommended for spatial audio.",
  ];
  return requirements.filter(Boolean);
};

function ExperienceMedia({ src, alt }) {
  if (src) {
    return <img src={src} alt={alt} className="h-full w-full object-cover" />;
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sand via-mist to-clay text-xs font-semibold uppercase tracking-[0.3em] text-slate/70">
      Preview
    </div>
  );
}

function SectionHeading({ eyebrow, title, copy }) {
  return (
    <div>
      {eyebrow ? (
        <p className="text-xs uppercase tracking-[0.3em] text-slate">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-2 font-display text-2xl text-ink">{title}</h2>
      {copy ? <p className="mt-2 text-sm text-slate">{copy}</p> : null}
    </div>
  );
}

export default function ExperiencePage() {
  const { experienceId } = useParams();
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
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

  const normalizedExperiences = useMemo(
    () => items.map((experience) => normalizeExperience(experience)),
    [items],
  );

  const experience = useMemo(
    () =>
      normalizedExperiences.find((item) => item.id === experienceId) || null,
    [normalizedExperiences, experienceId],
  );

  const related = useMemo(
    () =>
      normalizedExperiences
        .filter((item) => item.id !== experienceId)
        .slice(0, 3),
    [normalizedExperiences, experienceId],
  );

  const errorMessage = !catalogEnabled
    ? "Catalog API not configured. Set VITE_APPSYNC_ENDPOINT and VITE_APPSYNC_REGION."
    : isError
      ? "Unable to load this experience. Check AppSync configuration."
      : "";

  const handleAction = () => {
    if (!experience) {
      return;
    }

    if (experience.requiresAccess) {
      addToast({
        message: `Access requested for ${experience.title}.`,
        tone: "info",
      });
      return;
    }

    document.documentElement.requestFullscreen?.().catch(() => {});
    navigate(`/experiences/${experience.id}/launch`, {
      state: { from: location },
    });
  };

  const highlights = experience ? buildHighlights(experience) : [];
  const requirements = experience ? buildRequirements(experience) : [];
  const galleryImages = experience
    ? [
        experience.imageUrl,
        ...related.map((item) => item.imageUrl).filter(Boolean),
      ]
        .filter(Boolean)
        .slice(0, 3)
    : [];

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate">
            Experience
          </p>
          <h1 className="mt-2 font-display text-3xl text-ink">
            Experience detail
          </h1>
          <p className="mt-3 text-slate">
            Explore the trailer, requirements, and access details.
          </p>
        </div>
        <Button as={Link} to="/dashboard" variant="secondary">
          Back to dashboard
        </Button>
      </div>

      {errorMessage ? (
        <div className="mt-8 rounded-3xl border border-rose/30 bg-rose/10 px-6 py-4 text-sm text-rose">
          {errorMessage}
        </div>
      ) : null}

      {isLoading ? <ExperienceSkeleton /> : null}

      {!isLoading && experience ? (
        <div className="mt-10 grid min-w-0 gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="min-w-0 space-y-12">
            <motion.div
              className="space-y-5"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    statusStyles[experience.status] || statusStyles.available
                  }`}
                >
                  {experience.statusLabel}
                </span>
                {experience.requiresAccess ? (
                  <span className="rounded-full border border-rose/40 bg-rose/10 px-3 py-1 text-xs font-semibold text-rose">
                    Locked
                  </span>
                ) : (
                  <span className="rounded-full border border-ink/10 bg-white px-3 py-1 text-xs font-semibold text-ink">
                    Available now
                  </span>
                )}
              </div>
              <h2 className="font-display text-4xl text-ink">
                {experience.title}
              </h2>
              <p className="break-words text-lg text-slate">
                {experience.description}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={handleAction}>{experience.cta}</Button>
                <Button variant="secondary">Add to schedule</Button>
              </div>
              {experience.lockReason ? (
                <p className="break-words text-sm text-rose">
                  {experience.lockReason}
                </p>
              ) : null}
            </motion.div>

            <motion.section
              className="border-b border-white/60 pb-10"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <SectionHeading
                eyebrow="Quick facts"
                title="At a glance"
                copy="A fast read on time, players, and hardware."
              />
              <div className="mt-6 grid gap-4 text-xs text-slate sm:grid-cols-2">
                {[
                  { label: "Average time", value: experience.avgTime },
                  { label: "Players", value: experience.usersRequired },
                  { label: "Hardware", value: experience.hardware },
                  { label: "Status", value: experience.statusLabel },
                ]
                  .filter((item) => item.value)
                  .map((item) => (
                    <div
                      key={item.label}
                      className="rounded-xl border border-white/70 bg-white/80 px-4 py-3"
                    >
                      <p className="uppercase tracking-[0.2em] text-[0.55rem] text-slate/70">
                        {item.label}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-ink">
                        {item.value}
                      </p>
                    </div>
                  ))}
              </div>
            </motion.section>

            <motion.section
              className="border-b border-white/60 pb-10"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <SectionHeading
                eyebrow="Experience flow"
                title="What you will do"
                copy="A simple outline of what to expect during the session."
              />
              <ul className="mt-5 space-y-3 text-sm text-slate">
                {highlights.length ? (
                  highlights.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-1 h-2 w-2 rounded-full bg-ink" />
                      <span className="break-words">{item}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-slate">
                    Highlights will appear once more metadata is added.
                  </li>
                )}
              </ul>
            </motion.section>

            <motion.section
              className="border-b border-white/60 pb-10"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <SectionHeading
                eyebrow="Compatibility"
                title="Requirements"
                copy="Make sure your setup is ready before launching."
              />
              <ul className="mt-5 space-y-3 text-sm text-slate">
                {requirements.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-1 h-2 w-2 rounded-full bg-ink" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.section>

            <motion.section
              className="border-b border-white/60 pb-10"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <SectionHeading
                eyebrow="Gallery"
                title="Preview frames"
                copy="Still frames from the experience."
              />
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {galleryImages.length ? (
                  galleryImages.map((image) => (
                    <div
                      key={image}
                      className="overflow-hidden rounded-2xl border border-white/70 bg-white"
                    >
                      <ExperienceMedia src={image} alt={experience.title} />
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-white/70 bg-white px-4 py-6 text-sm text-slate">
                    No previews yet. Add images to populate the gallery.
                  </div>
                )}
              </div>
            </motion.section>

            <motion.section
              className="pb-2"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <SectionHeading
                eyebrow="More to explore"
                title="Related experiences"
                copy="Explore other sessions in the catalog."
              />
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {related.length ? (
                  related.map((item) => (
                    <Link
                      key={item.id}
                      to={`/experiences/${item.id}`}
                      className="rounded-xl border border-white/70 bg-white/80 p-4 text-sm text-slate transition hover:border-ink/20"
                    >
                      <p className="font-semibold text-ink">{item.title}</p>
                      <p className="mt-1 text-xs text-slate">
                        {item.statusLabel}
                      </p>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-slate">
                    No related experiences yet.
                  </p>
                )}
              </div>
            </motion.section>
          </div>

          <motion.aside
            className="h-fit min-w-0 lg:sticky lg:top-24"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
          >
            <div className="overflow-hidden rounded-3xl border border-white/60 bg-white/85 shadow-soft backdrop-blur">
              <div className="relative aspect-[16/10] min-h-[360px]">
                {experience.trailerUrl ? (
                  <video
                    controls
                    className="h-full w-full object-cover"
                    poster={experience.imageUrl || undefined}
                  >
                    <source src={experience.trailerUrl} />
                  </video>
                ) : (
                  <ExperienceMedia
                    src={experience.imageUrl}
                    alt={experience.title}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/20 to-transparent" />
                <div className="absolute bottom-4 left-4 rounded-full border border-white/40 bg-ink/70 px-3 py-1 text-xs font-semibold text-sand">
                  Trailer preview
                </div>
              </div>
            </div>
            <div className="space-y-3 p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-slate">
                Trailer
              </p>
              <h3 className="font-display text-xl text-ink">
                Watch the experience
              </h3>
              <p className="text-sm text-slate">
                Get a feel for the interaction style before you launch.
              </p>
            </div>
          </motion.aside>
        </div>
      ) : null}

      {!isLoading && !experience && !errorMessage ? (
        <div className="mt-10 rounded-3xl border border-white/60 bg-white/80 px-6 py-8 text-sm text-slate shadow-soft">
          We could not find that experience. Head back to the dashboard and
          select another one.
        </div>
      ) : null}
    </div>
  );
}
