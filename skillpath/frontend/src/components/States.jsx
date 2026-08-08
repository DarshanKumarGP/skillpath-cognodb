export function Loading({ label = "Loading" }) {
  return (
    <div className="flex items-center gap-3 text-muted py-16 justify-center">
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-60" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-gold" />
      </span>
      <span className="font-mono text-sm tracking-wide">{label}…</span>
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="panel border-rose/30 bg-rose/5 rounded-xl p-8 text-center">
      <div className="text-rose font-display text-lg mb-2">The signal dropped</div>
      <p className="text-muted max-w-md mx-auto mb-4">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary">
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, body, action }) {
  return (
    <div className="panel rounded-xl p-10 text-center border-dashed">
      <div className="font-display text-lg text-ink mb-2">{title}</div>
      {body && <p className="text-muted max-w-md mx-auto mb-4">{body}</p>}
      {action}
    </div>
  );
}
