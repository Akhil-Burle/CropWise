import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { ServicesProvider } from '@/services';
import { createMockServices } from '@/mock';
import { appError } from '@/services/errors';
import { decode } from '@/services/decode';
import { DualAdvisorySchema } from '@/services/schemas';
import { toAdvisory } from '@/services/mappers';
import Reports from '@/pages/Reports';

function renderWith(services) {
  return render(
    <ServicesProvider services={services}>
      <MemoryRouter>
        <Reports />
      </MemoryRouter>
    </ServicesProvider>,
  );
}

describe('service layer seam', () => {
  it('renders the Reports page against the mock services', async () => {
    const services = createMockServices();
    await services.auth.loginAsDemo('user-ramesh');
    renderWith(services);
    await waitFor(() => expect(screen.getAllByText(/Early blight/i).length).toBeGreaterThan(0), { timeout: 4000 });
  });

  it('swapping one service implementation needs no component change', async () => {
    const base = createMockServices();
    const fake = {
      ...base,
      analysis: {
        ...base.analysis,
        list: async () => ({
          items: [{ id: 'x1', createdAt: '2026-10-01T00:00:00Z', farmId: 'f', farmName: 'Test Farm', cropId: 'potato', cropName: 'Potato', diseaseName: 'Swapped disease', isHealthy: false, confidence: 0.8, status: 'complete', saved: false }],
          page: 1, pageSize: 8, total: 1, hasMore: false,
        }),
      },
    };
    renderWith(fake);
    expect((await screen.findAllByText(/Swapped disease/))[0]).toBeInTheDocument();
  });

  it('shows the uniform error state when a service rejects with AppError', async () => {
    const base = createMockServices();
    renderWith({ ...base, analysis: { ...base.analysis, list: () => Promise.reject(appError('NETWORK', 'down')) } });
    expect(await screen.findByRole('alert')).toHaveTextContent(/No connection/);
  });

  it('rejects malformed payloads at the boundary instead of crashing', () => {
    expect(() => decode(DualAdvisorySchema, { id: 1 }, toAdvisory)).toThrowError();
    try {
      decode(DualAdvisorySchema, { id: 1 }, toAdvisory);
    } catch (e) {
      expect(e.code).toBe('INVALID_RESPONSE');
    }
  });

  it('mock engine scales dose with acreage', async () => {
    const s = createMockServices();
    await s.auth.loginAsDemo('user-ramesh');
    const a = await s.advisory.getAdvisory({ analysisId: 'an-seed-1', area: 1, areaUnit: 'acre', lang: 'en' });
    const b = await s.advisory.getAdvisory({ analysisId: 'an-seed-1', area: 2, areaUnit: 'acre', lang: 'en' });
    expect(a.chemical.dose.perArea.value).toBe(b.chemical.dose.perArea.value);
    expect(b.chemical.water.total.value).toBe(a.chemical.water.total.value * 2);
  });
});

describe('farmer app', () => {
  it('shows the simple home with big actions and the harvest warning', async () => {
    const { default: FarmerHome } = await import('@/farmer/FarmerHome');
    const { useAuthStore } = await import('@/store/authStore');
    const services = createMockServices();
    const session = await services.auth.loginAsDemo('user-ramesh');
    useAuthStore.getState().setUser(session.user);
    render(
      <ServicesProvider services={services}>
        <MemoryRouter>
          <FarmerHome />
        </MemoryRouter>
      </ServicesProvider>,
    );
    expect(screen.getByText('Check my crop')).toBeInTheDocument();
    expect(await screen.findByText(/Don't harvest .* for \d+ more day/, {}, { timeout: 4000 })).toBeInTheDocument();
    expect(await screen.findByText(/Message from Dr\. Kavya Shetty/, {}, { timeout: 4000 })).toBeInTheDocument();
  });
});
