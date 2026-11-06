/**
 * Mock data source. Delete this folder (and its import in src/services/index.ts) once every
 * http adapter is implemented – nothing else in the app depends on it.
 */
import type { Services } from '@/services/contracts';
import { mockAuth, mockProfile } from './adapters/account';
import { mockFarms, mockSoil, mockWeather } from './adapters/farm';
import { mockAdvisory, mockAnalysis, mockDemo, mockUploads } from './adapters/analysis';
import { mockTransition, mockTreatments } from './adapters/plan';
import { mockAdmin, mockChat, mockLearn } from './adapters/content';

export function createMockServices(): Services {
  return {
    auth: mockAuth,
    profile: mockProfile,
    farms: mockFarms,
    uploads: mockUploads,
    demo: mockDemo,
    analysis: mockAnalysis,
    soil: mockSoil,
    advisory: mockAdvisory,
    transition: mockTransition,
    treatments: mockTreatments,
    learn: mockLearn,
    chat: mockChat,
    weather: mockWeather,
    admin: mockAdmin,
  };
}
