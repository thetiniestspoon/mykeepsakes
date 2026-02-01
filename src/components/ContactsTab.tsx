import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, AlertTriangle, Ship, Car, Plus, Users, Loader2 } from 'lucide-react';
import { EMERGENCY_CONTACTS, FERRY_INFO } from '@/lib/itinerary-data';
import { useFamilyContacts, FamilyContact } from '@/hooks/use-trip-data';
import { FamilyContactCard } from '@/components/contacts/FamilyContactCard';
import { ContactEditor } from '@/components/contacts/ContactEditor';
import { StaggeredList } from '@/components/ui/staggered-list';

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

  return (
    <div className="space-y-6 pb-20">
      <div className="text-center py-4">
        <h2 className="font-display text-2xl text-foreground">Quick Contacts</h2>
        <p className="text-muted-foreground">Important numbers at your fingertips</p>
      </div>
      
      {/* Family & Travel Party Contacts */}
      <Card className="shadow-warm border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="w-5 h-5 text-primary" />
            Family & Friends
          </CardTitle>
          <Button size="sm" onClick={handleAddContact}>
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : familyContacts && familyContacts.length > 0 ? (
            Object.entries(categoryLabels).map(([category, label]) => {
              const contacts = groupedContacts[category];
              if (!contacts || contacts.length === 0) return null;
              
              return (
                <div key={category} className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    {label}
                  </h4>
                  <StaggeredList className="space-y-2" staggerDelay={60}>
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
            })
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No contacts yet</p>
              <p className="text-sm">Add family members and travel companions</p>
              <Button className="mt-4" onClick={handleAddContact}>
                <Plus className="w-4 h-4 mr-1" />
                Add First Contact
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Emergency Contacts */}
      <Card className="shadow-warm border-destructive/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Emergency Contacts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {EMERGENCY_CONTACTS.map((contact) => (
            <a
              key={contact.id}
              href={`tel:${contact.phone}`}
              className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
            >
              <div>
                <p className="font-medium text-foreground">{contact.name}</p>
                <p className="text-sm text-muted-foreground">{contact.role}</p>
              </div>
              <div className="flex items-center gap-2 text-primary">
                <Phone className="w-4 h-4" />
                <span className="font-medium">{contact.phone}</span>
              </div>
            </a>
          ))}
        </CardContent>
      </Card>
      
      {/* Ferry Information */}
      <Card className="shadow-warm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Ship className="w-5 h-5 text-beach-ocean-deep" />
            Ferry Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(FERRY_INFO).map(([key, ferry]) => (
            <div key={key} className="p-4 rounded-lg bg-beach-ocean-light/20">
              <h4 className="font-semibold text-foreground">{ferry.name}</h4>
              <p className="text-sm text-muted-foreground mt-1">{ferry.schedule}</p>
              <p className="text-sm text-muted-foreground">{ferry.note}</p>
              
              <div className="flex flex-wrap gap-3 mt-3">
                <a
                  href={`tel:${ferry.phone}`}
                  className="inline-flex items-center gap-1 text-sm text-accent hover:underline"
                >
                  <Phone className="w-3 h-3" />
                  {ferry.phone}
                </a>
                <a
                  href={ferry.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-accent hover:underline"
                >
                  Book Tickets →
                </a>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      
      {/* Parking Tips */}
      <Card className="shadow-warm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Car className="w-5 h-5 text-beach-driftwood" />
            Parking Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              <span><strong>MacMillan Pier Lot:</strong> Central location, fills up early in summer. $3/hour.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              <span><strong>Grace Hall Lot:</strong> Short walk to Commercial Street. Free after 6pm.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              <span><strong>Beach Parking:</strong> National Seashore lots require fee. Arrive before 10am on weekends.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              <span><strong>Street Parking:</strong> Limited and strictly enforced. Check signs carefully!</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      <ContactEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        contact={editingContact}
      />
    </div>
  );
}
