import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Button from "./Button";

const navLinkClass = ({ isActive }) =>
  `text-sm font-medium ${isActive ? "text-ink" : "text-slate hover:text-ink"}`;

export default function Header() {
  //You can return a JS Object from a function, or in this case whatver you want that can be returned, it's like a filter.
  const { user, signOut, profile, avatarUrl } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const handleSignOut = async () => {
    try {
      await signOut();
      addToast({ message: "Signed out successfully.", tone: "info" });
      navigate("/");
    } catch (error) {
      addToast({ message: "Sign out failed. Please try again.", tone: "error" });
    }
  };

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const handleClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  const displayName =
    profile?.preferredUsername ||
    profile?.name ||
    user?.email?.split("@")[0] ||
    "Account";
  const initials = displayName.slice(0, 1).toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b border-white/60 bg-sand/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link
          to="/"
          className="flex items-center gap-3 font-display text-lg text-ink"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-sand">
            W
          </span>
          WeDev
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {!user ? (
            <NavLink to="/" className={navLinkClass}>
              Landing
            </NavLink>
          ) : null}
          {user ? (
            <NavLink to="/dashboard" className={navLinkClass}>
              Dashboard
            </NavLink>
          ) : null}
          {!user ? (
            <NavLink to="/login" className={navLinkClass}>
              Log in
            </NavLink>
          ) : null}
        </nav>
        <div className="flex items-center gap-3">
          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="flex items-center gap-3 rounded-full border border-white/60 bg-white/80 px-3 py-2 text-sm font-semibold text-ink shadow-soft transition hover:border-ink/20"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <div className="h-9 w-9 overflow-hidden rounded-full border border-clay/70 bg-mist">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-slate">
                      {initials}
                    </div>
                  )}
                </div>
                <span className="hidden sm:inline">{displayName}</span>
              </button>
              {menuOpen ? (
                <div
                  className="absolute right-0 mt-3 w-48 rounded-2xl border border-white/60 bg-white/95 p-2 text-sm text-slate shadow-soft backdrop-blur"
                  role="menu"
                >
                  <NavLink
                    to="/dashboard"
                    className="block rounded-xl px-3 py-2 text-ink hover:bg-mist"
                    onClick={() => setMenuOpen(false)}
                  >
                    Dashboard
                  </NavLink>
                  <NavLink
                    to="/settings"
                    className="block rounded-xl px-3 py-2 text-ink hover:bg-mist"
                    onClick={() => setMenuOpen(false)}
                  >
                    Settings
                  </NavLink>
                  <button
                    type="button"
                    className="block w-full rounded-xl px-3 py-2 text-left text-rose hover:bg-rose/10"
                    onClick={() => {
                      setMenuOpen(false);
                      handleSignOut();
                    }}
                  >
                    Sign out
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-semibold text-ink hover:underline"
              >
                Log in
              </Link>
              <Button as={Link} to="/signup">
                Get started
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
