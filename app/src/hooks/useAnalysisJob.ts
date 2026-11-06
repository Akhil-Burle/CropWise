import { useCallback } from 'react';
import { config } from '@/config';
import { useServices } from '@/services';
import type { AnalysisJobStatus } from '@/types';
import { usePolling } from './usePolling';

const isTerminal = (s: AnalysisJobStatus) => s.state === 'completed' || s.state === 'failed' || s.state === 'cancelled';

/** Polls an analysis job until it completes, fails, is cancelled or times out. */
export function useAnalysisJob(jobId: string | undefined) {
  const services = useServices();
  const fetcher = useCallback(() => services.analysis.getStatus(jobId ?? ''), [services, jobId]);
  const poll = usePolling<AnalysisJobStatus>({
    fetcher,
    isDone: isTerminal,
    intervalMs: config.polling.intervalMs,
    timeoutMs: config.polling.timeoutMs,
    enabled: Boolean(jobId),
  });

  const cancel = useCallback(async () => {
    poll.stop();
    if (jobId) await services.analysis.cancel(jobId);
  }, [jobId, poll, services]);

  return { status: poll.data, error: poll.error, polling: poll.polling, cancel, restart: poll.restart };
}
