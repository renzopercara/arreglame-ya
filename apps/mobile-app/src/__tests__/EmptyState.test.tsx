/**
 * Unit tests for the EmptyState component.
 *
 * Validates:
 * - Renders default title and subtitle
 * - Renders custom title, subtitle and CTA label
 * - Calls the onCta callback when button is clicked
 * - Does NOT render the CTA button when ctaLabel is omitted
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import EmptyState from '../components/EmptyState';

describe('EmptyState', () => {
  it('renders the default title and subtitle', () => {
    render(<EmptyState />);

    expect(screen.getByText('¿Necesitas ayuda con algo?')).toBeInTheDocument();
    expect(screen.getByText('Crea tu primera solicitud de trabajo ahora mismo.')).toBeInTheDocument();
  });

  it('renders a custom title and subtitle', () => {
    render(
      <EmptyState
        title="Sin resultados"
        subtitle="No hay nada aquí por ahora."
      />
    );

    expect(screen.getByText('Sin resultados')).toBeInTheDocument();
    expect(screen.getByText('No hay nada aquí por ahora.')).toBeInTheDocument();
  });

  it('renders the CTA button when ctaLabel and onCta are provided', () => {
    const handleCta = jest.fn();

    render(
      <EmptyState
        ctaLabel="Solicitar Servicio"
        onCta={handleCta}
      />
    );

    expect(screen.getByRole('button', { name: 'Solicitar Servicio' })).toBeInTheDocument();
  });

  it('calls onCta when the CTA button is clicked', () => {
    const handleCta = jest.fn();

    render(
      <EmptyState
        ctaLabel="Solicitar Servicio"
        onCta={handleCta}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Solicitar Servicio' }));
    expect(handleCta).toHaveBeenCalledTimes(1);
  });

  it('does NOT render a CTA button when ctaLabel is omitted', () => {
    render(<EmptyState />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('does NOT render a CTA button when onCta is omitted', () => {
    render(<EmptyState ctaLabel="Solicitar Servicio" />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
