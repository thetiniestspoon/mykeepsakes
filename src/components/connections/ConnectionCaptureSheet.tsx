import { useState, useRef, useEffect } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Loader2 } from 'lucide-react';
import { Stamp } from '@/preview/collage/ui/Stamp';
import { StickerPill } from '@/preview/collage/ui/StickerPill';
import { MarginNote } from '@/preview/collage/ui/MarginNote';
import { useCreateConnection } from '@/hooks/use-connections';
import '@/preview/collage/collage.css';

interface ConnectionCaptureSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string;
  currentDayId?: string;
}

function surnameOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  return (parts[parts.length - 1] ?? '').replace(/[.,]/g, '');
}

/**
 * Connection capture sheet — migrated to Collage direction (Phase 4 #10).
 * Sheet (shadcn) primitive preserved for slide-up animation. Content slot
 * wrapped with `collage-root` + paper surface. Index-card form on the left
 * + live Who's Who preview on the right (stacks on mobile). All form state,
 * auto-focus, reset-on-close, and createConnection mutation unchanged.
 */
export function ConnectionCaptureSheet({
  open,
  onOpenChange,
  tripId,
  currentDayId,
}: ConnectionCaptureSheetProps) {
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [metContext, setMetContext] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const nameRef = useRef<HTMLInputElement>(null);
  const { mutate: createConnection, isPending } = useCreateConnection();

  useEffect(() => {
    if (open) {
      setTimeout(() => nameRef.current?.focus(), 100);
    } else {
      setName('');
      setOrganization('');
      setMetContext('');
      setEmail('');
      setPhone('');
    }
  }, [open]);

  const handleSave = () => {
    if (!name.trim()) return;
    createConnection(
      {
        tripId,
        name: name.trim(),
        organization: organization.trim() || undefined,
        metContext: metContext.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        dayId: currentDayId,
      },
      {
        onSuccess: () => onOpenChange(false),
      }
    );
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontFamily: 'var(--c-font-display)',
    fontSize: 10,
    letterSpacing: '.22em',
    textTransform: 'uppercase',
    color: 'var(--c-ink-muted)',
    marginBottom: 6,
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    fontFamily: 'var(--c-font-body)',
    fontSize: 15,
    color: 'var(--c-ink)',
    background: 'var(--c-creme)',
    border: '1.5px solid var(--c-ink)',
    borderRadius: 'var(--c-r-sm)',
    padding: '10px 12px',
    outline: 'none',
    transition: 'border-color var(--c-t-fast) var(--c-ease-out)',
    boxSizing: 'border-box',
  };

  const focusOn = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = 'var(--c-pen)';
  };
  const focusOff = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = 'var(--c-ink)';
  };

  const canSave = name.trim().length > 0;

  const previewName = name.trim() || 'New Name';
  const previewOrg = organization.trim();
  const previewContext = metContext.trim();

  const dtStyle: React.CSSProperties = {
    fontFamily: 'var(--c-font-display)',
    fontSize: 8,
    letterSpacing: '.22em',
    textTransform: 'uppercase',
    color: 'var(--c-ink)',
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[90vh] overflow-y-auto p-0 border-0 bg-transparent shadow-none"
      >
        <div
          className="collage-root"
          style={{
            position: 'relative',
            background: 'var(--c-paper)',
            padding: '24px 20px 28px',
            borderTop: '1px solid var(--c-line)',
            boxShadow: 'var(--c-shadow)',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              flexWrap: 'wrap',
              marginBottom: 16,
            }}
          >
            <Stamp variant="ink" size="sm" rotate={-3}>
              add to the book
            </Stamp>
            <StickerPill variant="tape" rotate={-2}>
              connection
            </StickerPill>
          </div>

          <div
            className="mk-conn-split"
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
              gap: 20,
              alignItems: 'start',
            }}
          >
            {/* LEFT — form */}
            <section aria-label="Connection form" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label htmlFor="conn-name" style={{ display: 'block' }}>
                <span style={labelStyle}>name *</span>
                <input
                  id="conn-name"
                  ref={nameRef}
                  type="text"
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ ...inputStyle, fontSize: 17, fontWeight: 500 }}
                  onFocus={focusOn}
                  onBlur={focusOff}
                />
              </label>

              <label htmlFor="conn-org" style={{ display: 'block' }}>
                <span style={labelStyle}>role / organization</span>
                <input
                  id="conn-org"
                  type="text"
                  placeholder="Title or company"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  style={inputStyle}
                  onFocus={focusOn}
                  onBlur={focusOff}
                />
              </label>

              <label htmlFor="conn-context" style={{ display: 'block' }}>
                <span style={labelStyle}>how you met</span>
                <textarea
                  id="conn-context"
                  placeholder="Where and how did you connect?"
                  value={metContext}
                  onChange={(e) => setMetContext(e.target.value)}
                  rows={3}
                  style={{
                    ...inputStyle,
                    resize: 'vertical',
                    minHeight: 84,
                    fontFamily: 'var(--c-font-body)',
                    lineHeight: 1.5,
                  }}
                  onFocus={focusOn}
                  onBlur={focusOff}
                />
              </label>

              <label htmlFor="conn-email" style={{ display: 'block' }}>
                <span style={labelStyle}>email</span>
                <input
                  id="conn-email"
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={inputStyle}
                  onFocus={focusOn}
                  onBlur={focusOff}
                />
              </label>

              <label htmlFor="conn-phone" style={{ display: 'block' }}>
                <span style={labelStyle}>phone</span>
                <input
                  id="conn-phone"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={inputStyle}
                  onFocus={focusOn}
                  onBlur={focusOff}
                />
              </label>

              <button
                type="button"
                onClick={handleSave}
                disabled={!canSave || isPending}
                className="mk-conn-save"
                style={{
                  appearance: 'none',
                  cursor: !canSave || isPending ? 'not-allowed' : 'pointer',
                  width: '100%',
                  height: 48,
                  marginTop: 4,
                  background: !canSave || isPending ? 'var(--c-ink-muted)' : 'var(--c-ink)',
                  color: 'var(--c-creme)',
                  border: 0,
                  borderRadius: 'var(--c-r-sm)',
                  fontFamily: 'var(--c-font-display)',
                  fontSize: 12,
                  letterSpacing: '.26em',
                  textTransform: 'uppercase',
                  boxShadow: !canSave || isPending ? 'none' : 'var(--c-shadow-sm)',
                  opacity: !canSave || isPending ? 0.6 : 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  transition: 'transform var(--c-t-fast) var(--c-ease-out)',
                }}
              >
                {isPending ? (
                  <>
                    <Loader2 style={{ width: 16, height: 16 }} className="animate-spin" aria-hidden />
                    Saving…
                  </>
                ) : (
                  'Save connection'
                )}
              </button>
            </section>

            {/* RIGHT — live preview */}
            <section
              aria-label="Live preview"
              aria-live="polite"
              className="mk-conn-preview"
              style={{
                position: 'relative',
                background: 'var(--c-creme)',
                border: '1px dashed var(--c-line)',
                borderRadius: 'var(--c-r-sm)',
                padding: '18px 18px 20px',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--c-font-display)',
                  fontSize: 9,
                  letterSpacing: '.24em',
                  textTransform: 'uppercase',
                  color: 'var(--c-ink-muted)',
                  marginBottom: 12,
                }}
              >
                how it'll read in the index
              </div>

              {/* Index row */}
              <div
                style={{
                  borderBottom: '1px dashed var(--c-line)',
                  padding: '8px 0',
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1fr) auto',
                  alignItems: 'baseline',
                  gap: 8,
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--c-font-body)',
                    fontSize: 15,
                    fontWeight: 500,
                    color: 'var(--c-ink)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {surnameOf(previewName).toUpperCase() || '—'}
                  <span style={{ color: 'var(--c-ink-muted)', fontWeight: 400 }}>
                    {surnameOf(previewName) && previewName
                      ? `, ${previewName.replace(new RegExp(`\\s*${surnameOf(previewName)}\\s*$`), '')}`
                      : ''}
                  </span>
                </span>
                <span
                  aria-hidden
                  style={{
                    fontFamily: 'var(--c-font-display)',
                    fontSize: 8,
                    letterSpacing: '.2em',
                    color: 'var(--c-ink-muted)',
                  }}
                >
                  ·
                </span>
              </div>

              {/* Detail card stand-in */}
              <div
                style={{
                  marginTop: 14,
                  position: 'relative',
                  background: 'var(--c-paper)',
                  boxShadow: 'var(--c-shadow-sm)',
                  padding: '18px 16px',
                }}
              >
                <h3
                  style={{
                    fontFamily: 'var(--c-font-body)',
                    fontSize: 20,
                    fontWeight: 500,
                    margin: 0,
                    lineHeight: 1.15,
                    letterSpacing: '-.01em',
                    color: 'var(--c-ink)',
                  }}
                >
                  {previewName}
                </h3>
                {previewOrg && (
                  <p
                    style={{
                      fontFamily: 'var(--c-font-body)',
                      fontStyle: 'italic',
                      fontSize: 13,
                      color: 'var(--c-ink-muted)',
                      margin: '4px 0 0',
                    }}
                  >
                    {previewOrg}
                  </p>
                )}

                {previewContext && (
                  <div
                    style={{
                      marginTop: 12,
                      padding: '10px 12px',
                      borderLeft: '3px solid var(--c-pen)',
                      background: 'rgba(31, 60, 198, 0.04)',
                    }}
                  >
                    <div
                      style={{
                        fontFamily: 'var(--c-font-display)',
                        fontSize: 8,
                        letterSpacing: '.22em',
                        textTransform: 'uppercase',
                        color: 'var(--c-pen)',
                        marginBottom: 4,
                      }}
                    >
                      Where we met
                    </div>
                    <p
                      style={{
                        fontFamily: 'var(--c-font-body)',
                        fontSize: 14,
                        lineHeight: 1.4,
                        color: 'var(--c-ink)',
                        margin: 0,
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {previewContext}
                    </p>
                  </div>
                )}

                {(email.trim() || phone.trim()) && (
                  <dl
                    style={{
                      marginTop: 12,
                      display: 'grid',
                      gridTemplateColumns: 'auto 1fr',
                      rowGap: 4,
                      columnGap: 12,
                      fontFamily: 'var(--c-font-body)',
                      fontSize: 12,
                      color: 'var(--c-ink-muted)',
                      margin: '12px 0 0',
                    }}
                  >
                    {email.trim() && (
                      <>
                        <dt style={dtStyle}>email</dt>
                        <dd style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {email.trim()}
                        </dd>
                      </>
                    )}
                    {phone.trim() && (
                      <>
                        <dt style={dtStyle}>phone</dt>
                        <dd style={{ margin: 0 }}>{phone.trim()}</dd>
                      </>
                    )}
                  </dl>
                )}
              </div>

              <MarginNote rotate={-3} size={17} style={{ display: 'block', marginTop: 12 }}>
                — updates as you type
              </MarginNote>
            </section>
          </div>

          <style>{`
            .mk-conn-save:not(:disabled):hover { transform: translate(-1px, -1px); }
            .mk-conn-save:focus-visible {
              outline: 2px solid var(--c-pen);
              outline-offset: 3px;
            }
            @media (max-width: 720px) {
              .mk-conn-split { grid-template-columns: 1fr !important; }
            }
            @media (prefers-reduced-motion: reduce) {
              .mk-conn-save:not(:disabled):hover { transform: none; }
            }
          `}</style>
        </div>
      </SheetContent>
    </Sheet>
  );
}
