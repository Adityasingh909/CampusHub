import { Button } from "./Button";

export function ErrorState({ title = "Something went wrong", description, onRetry }) {
  return (
    <div className="rounded-2xl border border-rose-100 bg-rose-50 px-6 py-10 text-center">
      <h3 className="font-display text-lg font-semibold text-error">{title}</h3>
      {description ? (
        <p className="mt-2 text-sm text-rose-800">{description}</p>
      ) : null}
      {onRetry ? (
        <Button className="mt-5" variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
