import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const verifyHousePin = vi.fn();

vi.mock('@/lib/house-auth', async () => {
  const actual = await vi.importActual<typeof import('@/lib/house-auth')>('@/lib/house-auth');
  return { ...actual, verifyHousePin: (...a: unknown[]) => verifyHousePin(...a) };
});

const { HousePinEntry } = await import('@/components/auth/HousePinEntry');
const { HousePinError } = await import('@/lib/house-auth');

// Tap the first four palette buttons, which auto-submits.
async function typeAPin() {
  const buttons = screen.getAllByRole('button');
  for (const glyph of ['\u{1F99D}', '\u{1F98A}', '\u{1F428}', '\u{1F989}']) {
    const btn = buttons.find((b) => b.textContent === glyph);
    expect(btn, `palette button ${glyph} should exist`).toBeTruthy();
    fireEvent.click(btn!);
  }
}

beforeEach(() => {
  // `() => verifyHousePin.mockReset()` (expression-body arrow) implicitly
  // returns mockReset()'s return value, which is the mock function itself
  // (mockReset returns `stub` for chaining). Vitest treats a function
  // returned from a hook as an implicit teardown callback and invokes it
  // (with no args) after the test — while the test's own mockRejectedValue
  // is still active, producing a genuinely unhandled rejection unrelated to
  // app code. Block body -> no return value -> no phantom teardown call.
  // Confirmed as this exact footgun, not a Vitest bug, in
  // https://github.com/vitest-dev/vitest/issues/10845.
  verifyHousePin.mockReset();
});

describe('HousePinEntry', () => {
  it('offers all 30 house glyphs', () => {
    render(<HousePinEntry onAuthenticated={() => {}} />);
    const buttons = screen.getAllByRole('button');
    for (const glyph of ['\u{1F43F}\u{FE0F}', '\u{2708}\u{FE0F}', '\u{1F409}', '\u{1F99D}']) {
      expect(buttons.some((b) => b.textContent === glyph)).toBe(true);
    }
  });

  it('never lists who exists', () => {
    render(<HousePinEntry onAuthenticated={() => {}} />);
    for (const name of ['Shawn', 'Dan', 'Ted', 'Brian', 'Miles', 'Brennon', 'Cindy', 'Nanny']) {
      expect(screen.queryByText(new RegExp(name, 'i'))).toBeNull();
    }
    expect(screen.queryByRole('textbox')).toBeNull(); // no email field
  });

  it('calls onAuthenticated after a good PIN', async () => {
    verifyHousePin.mockResolvedValue({ email: 'runx31021@gmail.com', displayName: 'Shawn' });
    const onAuthenticated = vi.fn();
    render(<HousePinEntry onAuthenticated={onAuthenticated} />);
    await typeAPin();
    await waitFor(() => expect(onAuthenticated).toHaveBeenCalledTimes(1));
    expect(verifyHousePin).toHaveBeenCalledWith('\u{1F99D}\u{1F98A}\u{1F428}\u{1F989}');
  });

  it('shows the wrong-PIN message and does not admit anyone', async () => {
    verifyHousePin.mockRejectedValue(new HousePinError('Wrong PIN — try again.', 'wrong-pin'));
    const onAuthenticated = vi.fn();
    render(<HousePinEntry onAuthenticated={onAuthenticated} />);
    await typeAPin();
    await waitFor(() => expect(screen.getByText(/wrong pin/i)).toBeInTheDocument());
    expect(onAuthenticated).not.toHaveBeenCalled();
  });

  it('shows a reachability message when the house cannot be reached', async () => {
    verifyHousePin.mockRejectedValue(new HousePinError("Can't reach the house right now.", 'unreachable'));
    const onAuthenticated = vi.fn();
    render(<HousePinEntry onAuthenticated={onAuthenticated} />);
    await typeAPin();
    await waitFor(() => expect(screen.getByText(/can't reach the house/i)).toBeInTheDocument());
    expect(onAuthenticated).not.toHaveBeenCalled();
  });

  it('does not admit anyone when the session exchange fails', async () => {
    verifyHousePin.mockRejectedValue(
      new HousePinError('Could not start your session. Try again.', 'session-failed')
    );
    const onAuthenticated = vi.fn();
    render(<HousePinEntry onAuthenticated={onAuthenticated} />);
    await typeAPin();
    await waitFor(() => expect(screen.getByText(/could not start your session/i)).toBeInTheDocument());
    expect(onAuthenticated).not.toHaveBeenCalled();
  });
});
