'use client'

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="public-phase15-state public-phase15-state--error" role="alert">
      <h1 className="public-phase15-title" style={{ fontSize: '1.5rem' }}>
        Something went wrong
      </h1>
      <p className="public-phase15-copy">
        We could not load this page. Please try again.
      </p>
      <button type="button" className="public-phase15-retry" onClick={reset}>
        Try again
      </button>
      {process.env.NODE_ENV === 'development' && error?.message ? (
        <p className="public-phase15-copy" style={{ opacity: 0.5, fontSize: '0.75rem' }}>
          {error.message}
        </p>
      ) : null}
    </div>
  )
}
