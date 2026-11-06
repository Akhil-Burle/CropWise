import { Component } from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import i18n from '@/i18n';
import Button from './Button';

/**
 * Catches render errors so one broken screen shows a recovery message instead of a blank app.
 * `resetKey` (e.g. the current path) clears the error when the user navigates away.
 */
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // TODO: send to the crash reporter once one is chosen (e.g. Sentry).
    if (import.meta.env.DEV) console.error('[ErrorBoundary]', error, info.componentStack);
  }

  componentDidUpdate(prev) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  render() {
    if (!this.state.error) return this.props.children;
    const t = i18n.t.bind(i18n);
    return (
      <div role="alert" className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center">
        <AlertTriangle className="h-10 w-10 text-danger" aria-hidden="true" />
        <h1 className="text-2xl font-semibold">{t('errors.UNKNOWN.title')}</h1>
        <p className="text-ink-muted">{t('errors.UNKNOWN.description')}</p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button icon={RefreshCw} onClick={() => window.location.reload()}>{t('common.retry')}</Button>
          <Button variant="secondary" icon={Home} href="/app">{t('nav.home')}</Button>
        </div>
      </div>
    );
  }
}
