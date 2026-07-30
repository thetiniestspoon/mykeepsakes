import { describe, it, expect, vi, beforeEach } from 'vitest';

const invoke = vi.fn();
const verifyOtp = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: { invoke: (...a: unknown[]) => invoke(...a) },
    auth: { verifyOtp: (...a: unknown[]) => verifyOtp(...a) },
  },
}));

const { isAdmitted, verifyHousePin, HousePinError, KEEPSAKES_DENIED_EMAILS } = await import(
  '@/lib/house-auth'
);

beforeEach(() => {
  invoke.mockReset();
  verifyOtp.mockReset();
});

describe('isAdmitted', () => {
  it('denies Nanny', () => {
    expect(isAdmitted('cindy-nanny@family.internal')).toBe(false);
  });

  it('denies Nanny regardless of case or surrounding whitespace', () => {
    expect(isAdmitted('  Cindy-Nanny@Family.Internal  ')).toBe(false);
    expect(isAdmitted('CINDY-NANNY@FAMILY.INTERNAL')).toBe(false);
  });

  it('admits the accounts this repo knows about', () => {
    expect(isAdmitted('runx31021@gmail.com')).toBe(true);
    expect(isAdmitted('danllanes22@gmail.com')).toBe(true);
  });

  it('denies a session with no email at all', () => {
    // Fail closed on unknown input. Distinct from the fail-OPEN behaviour for
    // an unrecognised persona below — see spec D7; these are different axes and
    // the difference is deliberate.
    expect(isAdmitted(null)).toBe(false);
    expect(isAdmitted(undefined)).toBe(false);
    expect(isAdmitted('')).toBe(false);
    expect(isAdmitted('   ')).toBe(false);
  });

  it('admits an unrecognised persona (documented fail-open of a denylist)', () => {
    expect(isAdmitted('someone-new@example.com')).toBe(true);
  });

  it('denies exactly one address today', () => {
    expect(KEEPSAKES_DENIED_EMAILS).toEqual(['cindy-nanny@family.internal']);
  });
});

describe('verifyHousePin', () => {
  it('exchanges a PIN for a session and returns the persona', async () => {
    invoke.mockResolvedValue({
      data: { success: true, token_hash: 'abc123', email: 'runx31021@gmail.com', display_name: 'Shawn' },
      error: null,
    });
    verifyOtp.mockResolvedValue({ data: {}, error: null });

    await expect(verifyHousePin('🦝🦊🐨🦉')).resolves.toEqual({
      email: 'runx31021@gmail.com',
      displayName: 'Shawn',
    });

    expect(invoke).toHaveBeenCalledWith('verify-emoji-pin', { body: { emojiPin: '🦝🦊🐨🦉' } });
    expect(verifyOtp).toHaveBeenCalledWith({ token_hash: 'abc123', type: 'magiclink' });
  });

  it('reports a wrong PIN when the function rejects it (FunctionsHttpError)', async () => {
    invoke.mockResolvedValue({
      data: null,
      error: { name: 'FunctionsHttpError', message: 'Invalid emoji PIN' },
    });
    await expect(verifyHousePin('🦝🦝🦝🦝')).rejects.toMatchObject({ kind: 'wrong-pin' });
    expect(verifyOtp).not.toHaveBeenCalled();
  });

  it('reports unreachable when the function cannot be reached (FunctionsFetchError)', async () => {
    invoke.mockResolvedValue({
      data: null,
      error: { name: 'FunctionsFetchError', message: 'Failed to send a request to the function' },
    });
    await expect(verifyHousePin('🦝🦝🦝🦝')).rejects.toMatchObject({ kind: 'unreachable' });
    expect(verifyOtp).not.toHaveBeenCalled();
  });

  it('treats an unrecognised error name as unreachable, not as a wrong PIN', async () => {
    invoke.mockResolvedValue({
      data: null,
      error: { name: 'SomeFutureErrorClass', message: 'who knows' },
    });
    await expect(verifyHousePin('🦝🦝🦝🦝')).rejects.toMatchObject({ kind: 'unreachable' });
    expect(verifyOtp).not.toHaveBeenCalled();
  });

  it('treats a malformed success payload as unreachable, not as a login', async () => {
    invoke.mockResolvedValue({ data: { success: true }, error: null }); // no token_hash
    await expect(verifyHousePin('🦝🦊🐨🦉')).rejects.toMatchObject({ kind: 'unreachable' });
    expect(verifyOtp).not.toHaveBeenCalled();
  });

  it('fails loudly if the session exchange fails after a valid PIN', async () => {
    invoke.mockResolvedValue({
      data: { success: true, token_hash: 'abc123', email: 'a@b.c', display_name: 'A' },
      error: null,
    });
    verifyOtp.mockResolvedValue({ data: null, error: { message: 'token expired' } });
    await expect(verifyHousePin('🦝🦊🐨🦉')).rejects.toMatchObject({ kind: 'session-failed' });
  });

  it('throws HousePinError instances', async () => {
    invoke.mockRejectedValue(new Error('network down'));
    await expect(verifyHousePin('🦝🦊🐨🦉')).rejects.toBeInstanceOf(HousePinError);
  });
});
