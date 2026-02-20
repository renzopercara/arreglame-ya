/**
 * Unit tests for CategoryGrid component.
 *
 * Validates:
 * - Renders category buttons from GraphQL data
 * - Calls the onSelect handler with the correct categoryId
 * - Does NOT trigger a full page navigation (no window.location changes)
 * - Active category is visually distinguished
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing/react';
import CategoryGrid from '../components/CategoryGrid';
import { GET_SERVICE_CATEGORIES } from '../graphql/queries';

const mockCategories = [
  {
    id: 'cat-1',
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
    id: 'cat-2',
    slug: 'electricity',
    name: 'Electricidad',
    iconName: 'Zap',
    description: 'Servicios eléctricos',
    basePrice: 120,
    hourlyRate: 60,
    estimatedHours: 2,
    active: true,
  },
];

const categoriesMock = {
  request: {
    query: GET_SERVICE_CATEGORIES,
  },
  result: {
    data: {
      serviceCategories: mockCategories,
    },
  },
};

describe('CategoryGrid', () => {
  it('renders a loading state initially', () => {
    render(
      <MockedProvider mocks={[categoriesMock]} addTypename={false}>
        <CategoryGrid />
      </MockedProvider>
    );

    expect(screen.getByText('Cargando categorías...')).toBeInTheDocument();
  });

  it('renders category buttons after data loads', async () => {
    render(
      <MockedProvider mocks={[categoriesMock]} addTypename={false}>
        <CategoryGrid />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Plomería')).toBeInTheDocument();
      expect(screen.getByText('Electricidad')).toBeInTheDocument();
    });
  });

  it('calls onSelect with the correct categoryId when a button is clicked', async () => {
    const handleSelect = jest.fn();

    render(
      <MockedProvider mocks={[categoriesMock]} addTypename={false}>
        <CategoryGrid onSelect={handleSelect} />
      </MockedProvider>
    );

    await waitFor(() => expect(screen.getByText('Plomería')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Plomería'));
    expect(handleSelect).toHaveBeenCalledTimes(1);
    expect(handleSelect).toHaveBeenCalledWith('cat-1');
  });

  it('does not navigate to a /search URL when a category is clicked (no page reload)', async () => {
    const handleSelect = jest.fn();

    render(
      <MockedProvider mocks={[categoriesMock]} addTypename={false}>
        <CategoryGrid onSelect={handleSelect} />
      </MockedProvider>
    );

    await waitFor(() => expect(screen.getByText('Plomería')).toBeInTheDocument());

    const hrefBefore = window.location.href;
    fireEvent.click(screen.getByText('Plomería'));

    // The component only calls the callback; it never mutates window.location itself
    expect(handleSelect).toHaveBeenCalledWith('cat-1');
    expect(window.location.href).toBe(hrefBefore);
  });

  it('marks the active category with the active style', async () => {
    render(
      <MockedProvider mocks={[categoriesMock]} addTypename={false}>
        <CategoryGrid activeId="cat-1" />
      </MockedProvider>
    );

    await waitFor(() => expect(screen.getByText('Plomería')).toBeInTheDocument());

    const activeButton = screen.getByText('Plomería').closest('button');
    expect(activeButton).toHaveClass('bg-blue-600');
  });

  it('renders the full variant with descriptions', async () => {
    render(
      <MockedProvider mocks={[categoriesMock]} addTypename={false}>
        <CategoryGrid variant="full" />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Servicios de plomería')).toBeInTheDocument();
    });
  });

  it('shows an error message when the query fails', async () => {
    const errorMock = {
      request: { query: GET_SERVICE_CATEGORIES },
      error: new Error('Network error'),
    };

    render(
      <MockedProvider mocks={[errorMock]} addTypename={false}>
        <CategoryGrid />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Error al cargar categorías')).toBeInTheDocument();
    });
  });
});
