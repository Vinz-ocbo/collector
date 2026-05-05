import { Providers } from '@/app/providers';
import { Router } from '@/app/router';
import { ErrorFallback } from '@/app/ErrorFallback';
import { SentryErrorBoundary } from '@/app/sentry';

function renderFallback(props: { error: unknown; resetError: () => void }) {
  // Extracted out of the JSX prop because the inline destructuring trips
  // `@typescript-eslint/unbound-method` on Sentry's typed `resetError`.
  return <ErrorFallback error={props.error} resetError={props.resetError} />;
}

export function App() {
  return (
    <SentryErrorBoundary fallback={renderFallback}>
      <Providers>
        <Router />
      </Providers>
    </SentryErrorBoundary>
  );
}
