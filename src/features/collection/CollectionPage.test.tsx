import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Routes, Route } from 'react-router-dom';
import 'fake-indexeddb/auto';
import { db } from '@/shared/db';
import { renderWithProviders } from '@/test/auth-test-utils';
import { CollectionPage } from './CollectionPage';

async function setup() {
  await db.delete();
  await db.open();
  const { Wrapper } = renderWithProviders(
    <Routes>
      <Route path="/" element={<CollectionPage />} />
    </Routes>,
    { initialEntries: ['/'] },
  );
  return render(<Wrapper />);
}

describe('CollectionPage', () => {
  it('renders the empty state with the seed CTA', async () => {
    await setup();
    expect(
      await screen.findByRole('heading', { name: 'Pas encore de cartes' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Charger un jeu de démo/i })).toBeInTheDocument();
  });

  // The full seed → render integration is covered by the repository tests
  // (idempotent seedDemoData) + manual e2e in dev. Wiring `userEvent.click`
  // through the seed mutation here trips up Radix/Vaul portal handling in
  // jsdom without adding meaningful coverage.
});
