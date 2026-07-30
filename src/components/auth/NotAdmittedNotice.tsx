import { CollageRoot } from '@/preview/collage/CollageRoot';
import { Stamp } from '@/preview/collage/ui/Stamp';

/**
 * Shown when the house authenticated this persona but MyKeepsakes does not
 * admit them.
 *
 * Deliberately does NOT offer a sign-out button and the caller must NOT sign
 * them out: the Supabase session is shared across the whole origin, so evicting
 * them here would also evict them from the arcade games they ARE entitled to.
 */
export function NotAdmittedNotice() {
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
        </div>
      </div>
    </CollageRoot>
  );
}
