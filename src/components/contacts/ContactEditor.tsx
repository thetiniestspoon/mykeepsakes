import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { FamilyContact, useAddFamilyContact, useUpdateFamilyContact } from '@/hooks/use-trip-data';

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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{contact ? 'Edit Contact' : 'Add Contact'}</SheetTitle>
          <SheetDescription>
            {contact ? 'Update contact information' : 'Add a new family member or travel companion'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., John Smith"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g., (555) 123-4567"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
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

            <div className="space-y-2">
              <Label htmlFor="relationship">Relationship</Label>
              <Select value={relationship} onValueChange={setRelationship}>
                <SelectTrigger>
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

          <div className="space-y-2">
            <Label htmlFor="emergencyInfo">Emergency Info</Label>
            <Textarea
              id="emergencyInfo"
              value={emergencyInfo}
              onChange={(e) => setEmergencyInfo(e.target.value)}
              placeholder="Allergies, medical conditions, dietary restrictions..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes..."
              rows={2}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!name || isSubmitting} className="flex-1">
              {isSubmitting ? 'Saving...' : (contact ? 'Update' : 'Add Contact')}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
