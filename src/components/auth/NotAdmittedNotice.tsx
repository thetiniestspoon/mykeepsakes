import { CollageRoot } from '@/preview/collage/CollageRoot';
import { Stamp } from '@/preview/collage/ui/Stamp';

/**
 * Shown when the house authenticated this persona but MyKeepsakes does not
 * admit them.
 *
 * The caller must never sign them out automatically: the Supabase session is
 * shared across the whole origin, so evicting them here would also evict them
 * from the arcade games they ARE entitled to.
 *
 * `onUseDifferentPin` is the one sanctioned exception — an EXPLICIT request,
 * made by a person tapping a button that says what it will do. Without it a
 * shared iPad becomes a trap: whoever's PIN was entered last owns the app until
 * someone thinks to go sign out at the house, and the session self-refreshes so
 * waiting never clears it. Omit the prop and no button renders.
 */
export function NotAdmittedNotice({
  onUseDifferentPin,
}: {
  onUseDifferentPin?: () => void;
}) {
  return (
    <CollageRoot>
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <div style={{ maxWidth: '38ch', textAlign: 'center' }}>
          <Stamp variant="outline" size="sm" rotate={-3}>
            not this door
          </Stamp>
          <h1
            style={{
              fontFamily: 'var(--c-font-display)',
              fontSize: 'clamp(22px, 5vw, 32px)',
              color: 'var(--c-ink)',
              margin: '14px 0 0',
              lineHeight: 1.1,
            }}
          >
            MyKeepsakes isn't part of your account
          </h1>
          <p
            style={{
              fontFamily: 'var(--c-font-body)',
              fontSize: 15,
              color: 'var(--c-ink-muted)',
              marginTop: 12,
              lineHeight: 1.5,
            }}
          >
            The trip album is limited to the family accounts it was set up for.
            Everything else in the house still works normally — you can head back
            to the arcade.
          </p>

          {onUseDifferentPin && (
            <div style={{ marginTop: 22 }}>
              <button
                type="button"
                onClick={onUseDifferentPin}
                style={{
                  fontFamily: 'var(--c-font-body)',
                  fontSize: 15,
                  color: 'var(--c-ink)',
                  background: 'var(--c-paper)',
                  border: '1.5px solid var(--c-ink)',
                  borderRadius: 'var(--c-r-sm)',
                  padding: '10px 18px',
                  cursor: 'pointer',
                  boxShadow: 'var(--c-shadow-sm)',
                }}
              >
                This isn't me — use a different PIN
              </button>
              <p
                style={{
                  fontFamily: 'var(--c-font-body)',
                  fontStyle: 'italic',
                  fontSize: 13,
                  color: 'var(--c-ink-muted)',
                  margin: '10px auto 0',
                  maxWidth: '34ch',
                  lineHeight: 1.45,
                }}
              >
                This signs this device out of the Oak Park house — the arcade
                games will ask for a PIN again too.
              </p>
            </div>
          )}
        </div>
      </div>
    </CollageRoot>
  );
}
