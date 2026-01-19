export default function Footer() {
  return (
    <footer className="border-t border-white/60 bg-white/70">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-6 text-sm text-slate md:flex-row md:items-center md:justify-between">
        <p>WeDev Auth UI. Ready for AWS Cognito integration.</p>
        <div className="text-xs uppercase tracking-[0.2em] text-slate">
          Built with React and Tailwind
        </div>
      </div>
    </footer>
  );
}
