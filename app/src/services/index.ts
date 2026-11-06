/**
 * The single place where a data source is chosen. Components and hooks get services through
 * `useServices()`, so swapping mock → http (or injecting fakes in tests) needs no UI changes.
 *
 * The choice is made at build time through the `virtual-source` alias (see vite.config.js),
 * so a production build with VITE_DATA_SOURCE=http contains no mock data or mock engine.
 */
import { createContext, createElement, useContext, type ReactNode } from 'react';
import { createServices } from '@data-source';
import type { Services } from './contracts';
import { withOfflineCache } from './offline';

export const defaultServices: Services = withOfflineCache(createServices());

const ServicesContext = createContext<Services>(defaultServices);

export function ServicesProvider({ services, children }: { services?: Services; children: ReactNode }) {
  return createElement(ServicesContext.Provider, { value: services ?? defaultServices }, children);
}

export function useServices(): Services {
  return useContext(ServicesContext);
}

export * from './contracts';
export { appError, isAppError, toAppError } from './errors';
export { sessionEvents } from './session';
