import { Phone, Edit2, Trash2, AlertCircle, User, Users, MapPin } from 'lucide-react';
import { FamilyContact, useDeleteFamilyContact } from '@/hooks/use-trip-data';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { StickerPill } from '@/preview/collage/ui/StickerPill';
import '@/preview/collage/collage.css';

interface FamilyContactCardProps {
  contact: FamilyContact;
  onEdit: (contact: FamilyContact) => void;
}

const categoryConfig: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  family: { label: 'Family', icon: Users },
  travel_party: { label: 'Travel Party', icon: User },
  local: { label: 'Local', icon: MapPin },
};

/**
 * Index-card row for a family contact — Phase 4 #7 Collage migration.
 * Small round initial stamp, IBM Plex Serif name, Caveat/italic relationship
 * note, pen-blue phone link, pen-blue icon buttons. Hairline underline below
 * each row handled by parent list. Delete mutation unchanged.
 */
export function FamilyContactCard({ contact, onEdit }: FamilyContactCardProps) {
  const deleteContact = useDeleteFamilyContact();
  const config = categoryConfig[contact.category] || categoryConfig.family;
  const CategoryIcon = config.icon;
  const initial = (contact.name?.trim()[0] ?? '?').toUpperCase();

  return (
    <article
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '14px 12px',
        background: 'var(--c-paper)',
        border: '1px solid var(--c-line)',
        boxShadow: 'var(--c-shadow-sm)',
        fontFamily: 'var(--c-font-body)',
        color: 'var(--c-ink)',
      }}
    >
      {/* Initial stamp */}
      <div
        aria-hidden
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: '1.5px solid var(--c-ink)',
          background: 'var(--c-creme)',
          color: 'var(--c-ink)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--c-font-display)',
          fontSize: 16,
          flexShrink: 0,
          position: 'relative',
        }}
      >
        <span>{initial}</span>
        <CategoryIcon className="w-3 h-3 absolute -bottom-1 -right-1 bg-white rounded-full p-[1px]" />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
          <h4
            style={{
              margin: 0,
              fontFamily: 'var(--c-font-body)',
              fontSize: 16,
              fontWeight: 500,
              color: 'var(--c-ink)',
              lineHeight: 1.2,
            }}
          >
            {contact.name}
          </h4>
          <StickerPill variant="pen" style={{ fontSize: 9, padding: '4px 8px' }}>
            {config.label}
          </StickerPill>
        </div>

        {contact.relationship && (
          <p
            style={{
              margin: '4px 0 0',
              fontFamily: 'var(--c-font-script)',
              fontSize: 18,
              color: 'var(--c-pen)',
              lineHeight: 1.1,
            }}
          >
            {contact.relationship}
          </p>
        )}

        {contact.phone && (
          <a
            href={`tel:${contact.phone}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              marginTop: 8,
              fontSize: 13,
              color: 'var(--c-pen)',
              textDecoration: 'underline',
              textDecorationStyle: 'dotted',
              textUnderlineOffset: 3,
              fontFamily: 'var(--c-font-body)',
            }}
          >
            <Phone className="w-3 h-3" aria-hidden />
            {contact.phone}
          </a>
        )}

        {contact.emergency_info && (
          <div
            style={{
              marginTop: 10,
              padding: '8px 10px',
              background: 'rgba(168, 50, 50, 0.08)',
              borderLeft: '2px solid var(--c-danger, #A83232)',
              fontSize: 13,
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                color: 'var(--c-danger, #A83232)',
                fontFamily: 'var(--c-font-display)',
                fontSize: 9,
                letterSpacing: '.22em',
                textTransform: 'uppercase',
              }}
            >
              <AlertCircle className="w-3 h-3" aria-hidden />
              Emergency Info
            </div>
            <p style={{ margin: '4px 0 0', color: 'var(--c-ink-muted)' }}>
              {contact.emergency_info}
            </p>
          </div>
        )}

        {contact.notes && (
          <p
            style={{
              margin: '8px 0 0',
              fontSize: 13,
              color: 'var(--c-ink-muted)',
              fontStyle: 'italic',
              fontFamily: 'var(--c-font-body)',
            }}
          >
            {contact.notes}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
        <button
          type="button"
          onClick={() => onEdit(contact)}
          aria-label={`Edit ${contact.name}`}
          className="mk-icon-btn"
          style={iconButton('pen')}
        >
          <Edit2 className="w-4 h-4" aria-hidden />
        </button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              type="button"
              aria-label={`Delete ${contact.name}`}
              className="mk-icon-btn"
              style={iconButton('danger')}
            >
              <Trash2 className="w-4 h-4" aria-hidden />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <div className="collage-root">
              <AlertDialogHeader>
                <AlertDialogTitle asChild>
                  <h2
                    style={{
                      fontFamily: 'var(--c-font-body)',
                      fontSize: 22,
                      fontWeight: 500,
                      color: 'var(--c-ink)',
                      margin: 0,
                    }}
                  >
                    Delete contact?
                  </h2>
                </AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <p
                    style={{
                      fontFamily: 'var(--c-font-body)',
                      fontStyle: 'italic',
                      color: 'var(--c-ink-muted)',
                      fontSize: 14,
                      margin: '8px 0 0',
                    }}
                  >
                    Are you sure you want to delete {contact.name}? This action cannot be
                    undone.
                  </p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteContact.mutate(contact.id)}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <style>{`
        .mk-icon-btn:hover { background: rgba(31, 60, 198, 0.08); }
        .mk-icon-btn:focus-visible {
          outline: 2px solid var(--c-pen);
          outline-offset: 1px;
        }
      `}</style>
    </article>
  );
}

function iconButton(tint: 'pen' | 'danger'): React.CSSProperties {
  return {
    appearance: 'none',
    cursor: 'pointer',
    width: 32,
    height: 32,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'transparent',
    border: 0,
    borderRadius: 'var(--c-r-sm)',
    color: tint === 'pen' ? 'var(--c-pen)' : 'var(--c-danger, #A83232)',
    transition: 'background var(--c-t-fast) var(--c-ease-out)',
  };
}
