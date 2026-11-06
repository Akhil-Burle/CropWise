import { useCallback, useEffect, useState } from 'react';
import { create } from 'zustand';
import { useServices, type Services } from '@/services';
import { platform } from '@/platform';
import type { AnalysisInput, UploadKind, UploadRef } from '@/types';
import { useOnlineStatus } from './useEnvironment';

/**
 * Offline outbox for "Check my crop". Photos taken without network are kept on the phone
 * (as data URLs) and uploaded + submitted automatically when the network returns.
 */
export interface LocalPhoto {
  kind: UploadKind;
  fileName: string;
  mimeType: string;
  dataUrl: string;
}

export interface OutboxItem {
  id: string;
  createdAt: string;
  input: Omit<AnalysisInput, 'soilUploadId' | 'leafUploadId'>;
  soil: UploadRef | LocalPhoto | null;
  leaf: UploadRef | LocalPhoto | null;
}

const KEY = 'cw-outbox';

interface OutboxState {
  items: OutboxItem[];
  loaded: boolean;
  set: (items: OutboxItem[]) => void;
}

const useOutboxStore = create<OutboxState>()((set) => ({
  items: [],
  loaded: false,
  set: (items) => {
    set({ items, loaded: true });
    void platform.storage.set(KEY, JSON.stringify(items));
  },
}));

const isLocal = (p: UploadRef | LocalPhoto | null): p is LocalPhoto => Boolean(p && 'dataUrl' in p);

export function readAsLocalPhoto(file: File, kind: UploadKind): Promise<LocalPhoto> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve({ kind, fileName: file.name, mimeType: file.type, dataUrl: String(r.result) });
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

async function toUploadId(services: Services, p: UploadRef | LocalPhoto | null): Promise<string | null> {
  if (!p) return null;
  if (!isLocal(p)) return p.id;
  const blob = await (await fetch(p.dataUrl)).blob();
  const ref = await services.uploads.upload(new File([blob], p.fileName, { type: p.mimeType }), p.kind);
  return ref.id;
}

export function useOutbox() {
  const services = useServices();
  const online = useOnlineStatus();
  const { items, loaded, set } = useOutboxStore();
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (loaded) return;
    void platform.storage.get(KEY).then((raw) => {
      try {
        set(raw ? (JSON.parse(raw) as OutboxItem[]) : []);
      } catch {
        set([]);
      }
    });
  }, [loaded, set]);

  const enqueue = useCallback(
    (item: Omit<OutboxItem, 'id' | 'createdAt'>) => {
      set([...useOutboxStore.getState().items, { ...item, id: `ob-${Date.now()}`, createdAt: new Date().toISOString() }]);
    },
    [set],
  );

  /** Sends everything waiting. Returns the job ids created. */
  const flush = useCallback(async (): Promise<string[]> => {
    const queue = useOutboxStore.getState().items;
    if (!queue.length) return [];
    setSending(true);
    const jobs: string[] = [];
    const left: OutboxItem[] = [];
    for (const item of queue) {
      try {
        const [soilUploadId, leafUploadId] = await Promise.all([toUploadId(services, item.soil), toUploadId(services, item.leaf)]);
        const { jobId } = await services.analysis.submit({ ...item.input, soilUploadId, leafUploadId });
        jobs.push(jobId);
      } catch {
        left.push(item);
      }
    }
    set(left);
    setSending(false);
    return jobs;
  }, [services, set]);

  useEffect(() => {
    if (online && loaded && items.length && !sending) void flush();
  }, [online, loaded, items.length, sending, flush]);

  return { items, enqueue, flush, sending, online };
}
