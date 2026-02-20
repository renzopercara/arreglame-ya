/**
 * Integration tests for the CategoryGrid → search filtering flow.
 *
 * Validates:
 * - Selecting a category triggers the GraphQL getServices query with the correct categoryId
 * - Results update to reflect the filtered services
 * - No direct navigation to /search?category=... (RSC URL) occurs
 * - Clearing filters resets the category state
 */

import React, { useState } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing/react';
import CategoryGrid from '../components/CategoryGrid';
import { GET_SERVICE_CATEGORIES } from '../graphql/queries';
import { GET_SERVICES } from '../hooks/useServices';

// ──────────────────────────────────────────────────────────
// Mock data
// ──────────────────────────────────────────────────────────

const mockCategories = [
  {
    id: 'cat-plumbing',
    slug: 'plumbing',
    name: 'Plomería',
    iconName: 'Wrench',
    description: 'Servicios de plomería',
    basePrice: 100,
    hourlyRate: 50,
    estimatedHours: 2,
    active: true,
  },
  {
    id: 'cat-electrical',
    slug: 'electrical',
    name: 'Electricidad',
    iconName: 'Zap',
    description: 'Servicios eléctricos',
    basePrice: 120,
    hourlyRate: 60,
    estimatedHours: 2,
    active: true,
  },
];

const mockServicesAll = [
  { id: 'svc-1', title: 'Reparación de cañería', provider: 'Juan', price: 1500, category: 'plumbing', imageUrl: null },
  { id: 'svc-2', title: 'Instalación eléctrica', provider: 'Pedro', price: 2000, category: 'electrical', imageUrl: null },
];

const mockServicesPlumbing = [
  { id: 'svc-1', title: 'Reparación de cañería', provider: 'Juan', price: 1500, category: 'plumbing', imageUrl: null },
];

// ──────────────────────────────────────────────────────────
// Mocked GraphQL responses
// ──────────────────────────────────────────────────────────

const categoriesMock = {
  request: { query: GET_SERVICE_CATEGORIES },
  result: { data: { serviceCategories: mockCategories } },
};

const servicesAllMock = {
  request: {
    query: GET_SERVICES,
    variables: {
      location: 'Buenos Aires',
      latitude: -34.6,
      longitude: -58.4,
      radiusKm: 50,
    },
  },
  result: { data: { getServices: mockServicesAll } },
};

const servicesPlumbingMock = {
  request: {
    query: GET_SERVICES,
    variables: {
      category: 'cat-plumbing',
      location: 'Buenos Aires',
      latitude: -34.6,
      longitude: -58.4,
      radiusKm: 50,
    },
  },
  result: { data: { getServices: mockServicesPlumbing } },
};

// ──────────────────────────────────────────────────────────
// Test harness: lightweight wrapper that mirrors search page logic
// ──────────────────────────────────────────────────────────

import useServices from '../hooks/useServices';

function SearchTestHarness() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { services, loading } = useServices({
    category: selectedCategory,
    location: 'Buenos Aires',
    latitude: -34.6,
    longitude: -58.4,
    radiusKm: 50,
  });

  const handleCategorySelect = (id: string | null) => {
    // State-driven, no router.replace in this harness
    setSelectedCategory(id);
  };

  return (
    <div>
      <CategoryGrid onSelect={handleCategorySelect} activeId={selectedCategory} />

      {loading && <p>Cargando servicios...</p>}

      <ul data-testid="service-list">
        {services.map((s) => (
          <li key={s.id}>{s.title}</li>
        ))}
      </ul>

      <button onClick={() => handleCategorySelect(null)}>Limpiar filtros</button>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────────────────

describe('CategoryGrid → Search integration', () => {
  it('renders all services when no category is selected', async () => {
    render(
      <MockedProvider mocks={[categoriesMock, servicesAllMock]} addTypename={false}>
        <SearchTestHarness />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Reparación de cañería')).toBeInTheDocument();
      expect(screen.getByText('Instalación eléctrica')).toBeInTheDocument();
    });
  });

  it('triggers GraphQL query with correct categoryId when category is selected', async () => {
    render(
      <MockedProvider
        mocks={[categoriesMock, servicesAllMock, servicesPlumbingMock]}
        addTypename={false}
      >
        <SearchTestHarness />
      </MockedProvider>
    );

    // Wait for categories to load
    await waitFor(() => expect(screen.getByText('Plomería')).toBeInTheDocument());

    // Select "Plomería" category
    fireEvent.click(screen.getByText('Plomería'));

    // Services list should update to plumbing only
    await waitFor(() => {
      expect(screen.getByText('Reparación de cañería')).toBeInTheDocument();
      expect(screen.queryByText('Instalación eléctrica')).not.toBeInTheDocument();
    });
  });

  it('does not navigate to /search?category=... (no RSC URL)', async () => {
    render(
      <MockedProvider
        mocks={[categoriesMock, servicesAllMock, servicesPlumbingMock]}
        addTypename={false}
      >
        <SearchTestHarness />
      </MockedProvider>
    );

    await waitFor(() => expect(screen.getByText('Plomería')).toBeInTheDocument());

    const hrefBefore = window.location.href;
    fireEvent.click(screen.getByText('Plomería'));

    // No full page navigation: the href must not change (no _rsc= streaming response)
    expect(window.location.href).toBe(hrefBefore);
  });

  it('resets services when filters are cleared', async () => {
    render(
      <MockedProvider
        mocks={[categoriesMock, servicesAllMock, servicesPlumbingMock, servicesAllMock]}
        addTypename={false}
      >
        <SearchTestHarness />
      </MockedProvider>
    );

    await waitFor(() => expect(screen.getByText('Plomería')).toBeInTheDocument());

    // Select a category
    fireEvent.click(screen.getByText('Plomería'));
    await waitFor(() =>
      expect(screen.queryByText('Instalación eléctrica')).not.toBeInTheDocument()
    );

    // Clear filters
    fireEvent.click(screen.getByText('Limpiar filtros'));

    await waitFor(() => {
      expect(screen.getByText('Instalación eléctrica')).toBeInTheDocument();
    });
  });
});
