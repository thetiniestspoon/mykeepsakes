import { useState } from 'react';
import { Phone, AlertTriangle, Plane, Car, Plus, Users, Loader2 } from 'lucide-react';
import { EMERGENCY_CONTACTS, TRANSPORT_INFO } from '@/lib/itinerary-data';
import { useFamilyContacts, FamilyContact } from '@/hooks/use-trip-data';
import { FamilyContactCard } from '@/components/contacts/FamilyContactCard';
import { ContactEditor } from '@/components/contacts/ContactEditor';
import { StaggeredList } from '@/components/ui/staggered-list';
import '@/preview/collage/collage.css';
import { Stamp } from '@/preview/collage/ui/Stamp';
import { Tape } from '@/preview/collage/ui/Tape';
import { MarginNote } from '@/preview/collage/ui/MarginNote';

/**
 * Quick Contacts drawer surface — migrated to Collage (Phase 4 #7).
 * Who's-Who-Index vocabulary: stamp headers as section labels, pen-blue
 * hairline rules between entries, IBM Plex Serif body. CRUD hooks
 * (useFamilyContacts, ContactEditor) unchanged; only chrome restyled.
 */
export function ContactsTab() {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<FamilyContact | null>(null);

  const { data: familyContacts, isLoading } = useFamilyContacts();

  const handleAddContact = () => {
    setEditingContact(null);
    setEditorOpen(true);
  };

  const handleEditContact = (contact: FamilyContact) => {
    setEditingContact(contact);
    setEditorOpen(true);
  };

  // Group contacts by category
  const groupedContacts = (familyContacts || []).reduce((acc, contact) => {
    const category = contact.category || 'family';
    if (!acc[category]) acc[category] = [];
    acc[category].push(contact);
    return acc;
  }, {} as Record<string, FamilyContact[]>);

  const categoryLabels: Record<string, string> = {
    family: 'Family',
    travel_party: 'Travel Party',
    local: 'Local Contacts',
  };

  // Paper-card panel — inline-styled Collage surface.
  const panelStyle: React.CSSProperties = {
    position: 'relative',
    background: 'var(--c-paper)',
    boxShadow: 'var(--c-shadow)',
    padding: '22px 22px 24px',
    border: '1px solid var(--c-line)',
  };

  const addButton = (full: boolean, label = 'Add') => (
    <button
      type="button"
      onClick={handleAddContact}
      style={{
        appearance: 'none',
        cursor: 'pointer',
        width: full ? '100%' : undefined,
        padding: '10px 16px',
        fontFamily: 'var(--c-font-display)',
        fontSize: 11,
        letterSpacing: '.22em',
        textTransform: 'uppercase',
        borderRadius: 'var(--c-r-sm)',
        background: 'var(--c-ink)',
        color: 'var(--c-creme)',
        border: 0,
        boxShadow: 'var(--c-shadow-sm)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      }}
    >
      <Plus className="w-3.5 h-3.5" />
      {label}
    </button>
  );

  return (
    <div className="collage-root" style={{ padding: '4px 2px 80px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header — stamp + title */}
      <header style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '8px 2px 4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Stamp variant="ink" size="md" rotate={-1.5}>
            QUICK CONTACTS
          </Stamp>
        </div>
        <h2
          style={{
            fontFamily: 'var(--c-font-body)',
            fontSize: 22,
            fontWeight: 500,
            margin: 0,
            lineHeight: 1.1,
            color: 'var(--c-ink)',
          }}
        >
          Numbers at your fingertips
        </h2>
        <p
          style={{
            fontFamily: 'var(--c-font-body)',
            fontStyle: 'italic',
            fontSize: 13,
            color: 'var(--c-ink-muted)',
            margin: 0,
          }}
        >
          Family, emergency, and how to get there.
        </p>
      </header>

      {/* Family & Friends */}
      <section style={panelStyle} aria-label="Family and friends">
        <Tape position="top" rotate={-3} width={80} />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            marginBottom: 14,
            paddingBottom: 10,
            borderBottom: '1px solid var(--c-line)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Users className="w-4 h-4" style={{ color: 'var(--c-pen)' }} aria-hidden />
            <Stamp variant="plain" size="sm" style={{ padding: 0, color: 'var(--c-ink)' }}>
              family &amp; friends
            </Stamp>
          </div>
          {addButton(false)}
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '28px 0' }}>
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--c-ink-muted)' }} aria-hidden />
          </div>
        ) : familyContacts && familyContacts.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {Object.entries(categoryLabels).map(([category, label]) => {
              const contacts = groupedContacts[category];
              if (!contacts || contacts.length === 0) return null;

              return (
                <div key={category} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div
                    style={{
                      fontFamily: 'var(--c-font-display)',
                      fontSize: 10,
                      letterSpacing: '.24em',
                      color: 'var(--c-pen)',
                      textTransform: 'uppercase',
                      padding: '2px 0 2px',
                    }}
                  >
                    {label}
                  </div>
                  <StaggeredList
                    className="flex flex-col gap-2"
                    staggerDelay={60}
                  >
                    {contacts.map((contact) => (
                      <FamilyContactCard
                        key={contact.id}
                        contact={contact}
                        onEdit={handleEditContact}
                      />
                    ))}
                  </StaggeredList>
                </div>
              );
            })}
          </div>
        ) : (
          <div
            style={{
              textAlign: 'center',
              padding: '28px 8px 12px',
              color: 'var(--c-ink-muted)',
              fontFamily: 'var(--c-font-body)',
            }}
          >
            <Users className="w-10 h-10 mx-auto mb-3" style={{ opacity: 0.5 }} aria-hidden />
            <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--c-ink)', margin: 0 }}>
              No contacts yet
            </p>
            <p style={{ fontSize: 13, fontStyle: 'italic', margin: '4px 0 0' }}>
              Add family members and travel companions
            </p>
            <MarginNote rotate={-3} size={20} style={{ display: 'block', margin: '10px 0 14px' }}>
              — first names land here
            </MarginNote>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              {addButton(false, 'Add First Contact')}
            </div>
          </div>
        )}
      </section>

      {/* Emergency Contacts */}
      <section
        style={{ ...panelStyle, borderLeft: '3px solid var(--c-danger, #A83232)' }}
        aria-label="Emergency contacts"
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 12,
            paddingBottom: 10,
            borderBottom: '1px solid var(--c-line)',
          }}
        >
          <AlertTriangle className="w-4 h-4" style={{ color: 'var(--c-danger, #A83232)' }} aria-hidden />
          <Stamp variant="plain" size="sm" style={{ padding: 0, color: 'var(--c-danger, #A83232)' }}>
            emergency
          </Stamp>
        </div>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column' }}>
          {EMERGENCY_CONTACTS.map((contact, idx) => (
            <li
              key={contact.id}
              style={{
                borderBottom: idx === EMERGENCY_CONTACTS.length - 1 ? 'none' : '1px dashed var(--c-line)',
              }}
            >
              <a
                href={`tel:${contact.phone}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 2px',
                  gap: 12,
                  textDecoration: 'none',
                  color: 'var(--c-ink)',
                  fontFamily: 'var(--c-font-body)',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 500 }}>{contact.name}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, fontStyle: 'italic', color: 'var(--c-ink-muted)' }}>
                    {contact.role}
                  </p>
                </div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    color: 'var(--c-pen)',
                    fontWeight: 500,
                    fontSize: 14,
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Phone className="w-3.5 h-3.5" aria-hidden />
                  <span>{contact.phone}</span>
                </div>
              </a>
            </li>
          ))}
        </ul>
      </section>

      {/* Transport Information */}
      <section style={panelStyle} aria-label="Getting there">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 12,
            paddingBottom: 10,
            borderBottom: '1px solid var(--c-line)',
          }}
        >
          <Plane className="w-4 h-4" style={{ color: 'var(--c-pen)' }} aria-hidden />
          <Stamp variant="plain" size="sm" style={{ padding: 0, color: 'var(--c-ink)' }}>
            getting there
          </Stamp>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {Object.entries(TRANSPORT_INFO).map(([key, transport], idx, arr) => (
            <div
              key={key}
              style={{
                padding: '12px 14px',
                background: 'rgba(31, 60, 198, 0.04)',
                borderLeft: '2px solid var(--c-pen)',
                borderBottom: idx === arr.length - 1 ? undefined : undefined,
              }}
            >
              <h4 style={{ margin: 0, fontFamily: 'var(--c-font-body)', fontSize: 15, fontWeight: 500, color: 'var(--c-ink)' }}>
                {transport.name}
              </h4>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--c-ink-muted)', fontFamily: 'var(--c-font-body)' }}>
                {transport.schedule}
              </p>
              <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--c-ink-muted)', fontStyle: 'italic', fontFamily: 'var(--c-font-body)' }}>
                {transport.note}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 8 }}>
                {'phone' in transport && transport.phone && (
                  <a
                    href={`tel:${transport.phone}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 13,
                      color: 'var(--c-pen)',
                      fontFamily: 'var(--c-font-body)',
                      textDecoration: 'underline',
                      textDecorationStyle: 'dotted',
                      textUnderlineOffset: 3,
                    }}
                  >
                    <Phone className="w-3 h-3" aria-hidden />
                    {transport.phone}
                  </a>
                )}
                {transport.website && (
                  <a
                    href={transport.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: 13,
                      color: 'var(--c-pen)',
                      fontFamily: 'var(--c-font-body)',
                      textDecoration: 'underline',
                      textDecorationStyle: 'dotted',
                      textUnderlineOffset: 3,
                    }}
                  >
                    More Info →
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Parking Tips */}
      <section style={panelStyle} aria-label="Parking tips">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 12,
            paddingBottom: 10,
            borderBottom: '1px solid var(--c-line)',
          }}
        >
          <Car className="w-4 h-4" style={{ color: 'var(--c-ink-muted)' }} aria-hidden />
          <Stamp variant="plain" size="sm" style={{ padding: 0, color: 'var(--c-ink)' }}>
            parking
          </Stamp>
        </div>
        <ul
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            fontFamily: 'var(--c-font-body)',
            fontSize: 13,
            color: 'var(--c-ink-muted)',
          }}
        >
          <li style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
            <span aria-hidden style={{ color: 'var(--c-pen)', fontWeight: 600 }}>•</span>
            <span>
              <strong style={{ color: 'var(--c-ink)', fontWeight: 500 }}>Hotel Parking:</strong>{' '}
              Complimentary self-parking at Chicago Marriott Oak Brook.
            </span>
          </li>
          <li style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
            <span aria-hidden style={{ color: 'var(--c-pen)', fontWeight: 600 }}>•</span>
            <span>
              <strong style={{ color: 'var(--c-ink)', fontWeight: 500 }}>Oakbrook Center:</strong>{' '}
              Free parking at the outdoor mall, 5 min walk from hotel.
            </span>
          </li>
          <li style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
            <span aria-hidden style={{ color: 'var(--c-pen)', fontWeight: 600 }}>•</span>
            <span>
              <strong style={{ color: 'var(--c-ink)', fontWeight: 500 }}>Downtown Chicago:</strong>{' '}
              Use Metra BNSF or rideshare. Street parking is expensive and scarce.
            </span>
          </li>
          <li style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
            <span aria-hidden style={{ color: 'var(--c-pen)', fontWeight: 600 }}>•</span>
            <span>
              <strong style={{ color: 'var(--c-ink)', fontWeight: 500 }}>Airport:</strong>{' '}
              Uber/Lyft recommended to/from O'Hare. 25-30 min from hotel.
            </span>
          </li>
        </ul>
      </section>

      <ContactEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        contact={editingContact}
      />
    </div>
  );
}
