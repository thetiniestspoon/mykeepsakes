import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FamilyContact, useAddFamilyContact, useUpdateFamilyContact } from '@/hooks/use-trip-data';
import { Stamp } from '@/preview/collage/ui/Stamp';
import '@/preview/collage/collage.css';

interface ContactEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: FamilyContact | null;
}

const CATEGORIES = [
  { value: 'family', label: 'Family' },
  { value: 'travel_party', label: 'Travel Party' },
  { value: 'local', label: 'Local Contacts' },
];

const RELATIONSHIPS = [
  'Parent', 'Child', 'Spouse', 'Sibling', 'Grandparent',
  'Aunt/Uncle', 'Cousin', 'Friend', 'Host', 'Other'
];

/**
 * Contact add/edit sheet — migrated to Collage (Phase 4 #7).
 * Shadcn Sheet (bottom drawer) is preserved for animation; content is
 * wrapped in `.collage-root` so tokens scope cleanly. Inputs use hairline
 * underline style, IBM Plex Serif, pen-blue focus ring. Hooks unchanged.
 */
export function ContactEditor({ open, onOpenChange, contact }: ContactEditorProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState('');
  const [category, setCategory] = useState('family');
  const [emergencyInfo, setEmergencyInfo] = useState('');
  const [notes, setNotes] = useState('');

  const addContact = useAddFamilyContact();
  const updateContact = useUpdateFamilyContact();

  // Reset form when contact changes or dialog opens
  useEffect(() => {
    if (contact) {
      setName(contact.name);
      setPhone(contact.phone || '');
      setRelationship(contact.relationship || '');
      setCategory(contact.category);
      setEmergencyInfo(contact.emergency_info || '');
      setNotes(contact.notes || '');
    } else {
      setName('');
      setPhone('');
      setRelationship('');
      setCategory('family');
      setEmergencyInfo('');
      setNotes('');
    }
  }, [contact, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const contactData = {
      name,
      phone: phone || null,
      relationship: relationship || null,
      category,
      emergency_info: emergencyInfo || null,
      notes: notes || null,
    };

    if (contact) {
      await updateContact.mutateAsync({ id: contact.id, ...contactData });
    } else {
      await addContact.mutateAsync(contactData);
    }

    onOpenChange(false);
  };

  const isSubmitting = addContact.isPending || updateContact.isPending;

  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--c-font-display)',
    fontSize: 10,
    letterSpacing: '.22em',
    textTransform: 'uppercase',
    color: 'var(--c-ink)',
    display: 'block',
    marginBottom: 6,
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 2px',
    fontFamily: 'var(--c-font-body)',
    fontSize: 16,
    color: 'var(--c-ink)',
    background: 'transparent',
    border: 'none',
    borderBottom: '1.5px solid var(--c-ink)',
    borderRadius: 0,
    outline: 'none',
    boxSizing: 'border-box',
  };

  const textareaStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    fontFamily: 'var(--c-font-body)',
    fontSize: 15,
    color: 'var(--c-ink)',
    background: 'var(--c-paper)',
    border: '1px solid var(--c-ink)',
    borderRadius: 'var(--c-r-sm)',
    outline: 'none',
    boxSizing: 'border-box',
    resize: 'vertical',
    minHeight: 56,
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[88vh] overflow-y-auto p-0 border-0">
        <div
          className="collage-root"
          style={{
            padding: '22px 20px 28px',
            minHeight: '100%',
          }}
        >
          <SheetHeader className="text-left space-y-2">
            <Stamp variant="ink" size="sm" rotate={-2}>
              {contact ? 'edit contact' : 'new contact'}
            </Stamp>
            <SheetTitle asChild>
              <h2
                style={{
                  fontFamily: 'var(--c-font-body)',
                  fontSize: 22,
                  fontWeight: 500,
                  letterSpacing: '-.005em',
                  margin: '10px 0 2px',
                  color: 'var(--c-ink)',
                }}
              >
                {contact ? 'Edit contact' : 'Add a contact'}
              </h2>
            </SheetTitle>
            <SheetDescription asChild>
              <p
                style={{
                  fontFamily: 'var(--c-font-body)',
                  fontStyle: 'italic',
                  color: 'var(--c-ink-muted)',
                  margin: 0,
                  fontSize: 13,
                }}
              >
                {contact ? 'Update contact information' : 'A new family member or travel companion'}
              </p>
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label htmlFor="name" style={labelStyle}>
                Name *
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., John Smith"
                required
                className="mk-collage-input"
                style={inputStyle}
              />
            </div>

            <div>
              <label htmlFor="phone" style={labelStyle}>
                Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g., (555) 123-4567"
                className="mk-collage-input"
                style={inputStyle}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label htmlFor="category" style={labelStyle}>
                  Category
                </label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger
                    id="category"
                    className="border-0 border-b-[1.5px] border-[var(--c-ink)] rounded-none bg-transparent px-0 font-[var(--c-font-body)] text-[16px] focus:ring-0 focus:outline-none focus-visible:ring-0 h-auto py-[10px]"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label htmlFor="relationship" style={labelStyle}>
                  Relationship
                </label>
                <Select value={relationship} onValueChange={setRelationship}>
                  <SelectTrigger
                    id="relationship"
                    className="border-0 border-b-[1.5px] border-[var(--c-ink)] rounded-none bg-transparent px-0 font-[var(--c-font-body)] text-[16px] focus:ring-0 focus:outline-none focus-visible:ring-0 h-auto py-[10px]"
                  >
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {RELATIONSHIPS.map((rel) => (
                      <SelectItem key={rel} value={rel}>
                        {rel}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label htmlFor="emergencyInfo" style={labelStyle}>
                Emergency Info
              </label>
              <textarea
                id="emergencyInfo"
                value={emergencyInfo}
                onChange={(e) => setEmergencyInfo(e.target.value)}
                placeholder="Allergies, medical conditions, dietary restrictions…"
                rows={2}
                className="mk-collage-input"
                style={textareaStyle}
              />
            </div>

            <div>
              <label htmlFor="notes" style={labelStyle}>
                Notes
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes…"
                rows={2}
                className="mk-collage-input"
                style={textareaStyle}
              />
            </div>

            <div style={{ display: 'flex', gap: 12, paddingTop: 12 }}>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                style={{
                  flex: 1,
                  appearance: 'none',
                  cursor: 'pointer',
                  padding: '12px 14px',
                  fontFamily: 'var(--c-font-display)',
                  fontSize: 11,
                  letterSpacing: '.22em',
                  textTransform: 'uppercase',
                  borderRadius: 'var(--c-r-sm)',
                  background: 'var(--c-creme)',
                  color: 'var(--c-ink)',
                  border: '1.5px solid var(--c-ink)',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!name || isSubmitting}
                style={{
                  flex: 1,
                  appearance: 'none',
                  cursor: !name || isSubmitting ? 'not-allowed' : 'pointer',
                  padding: '12px 14px',
                  fontFamily: 'var(--c-font-display)',
                  fontSize: 11,
                  letterSpacing: '.22em',
                  textTransform: 'uppercase',
                  borderRadius: 'var(--c-r-sm)',
                  background: 'var(--c-ink)',
                  color: 'var(--c-creme)',
                  border: 0,
                  boxShadow: 'var(--c-shadow-sm)',
                  opacity: !name || isSubmitting ? 0.45 : 1,
                }}
              >
                {isSubmitting ? 'Saving…' : contact ? 'Update' : 'Add Contact'}
              </button>
            </div>
          </form>

          <style>{`
            .collage-root .mk-collage-input:focus {
              border-color: var(--c-pen);
              box-shadow: 0 1px 0 0 var(--c-pen);
            }
          `}</style>
        </div>
      </SheetContent>
    </Sheet>
  );
}
