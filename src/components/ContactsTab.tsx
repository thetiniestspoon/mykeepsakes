import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, AlertTriangle, Ship, Car } from 'lucide-react';
import { EMERGENCY_CONTACTS, FERRY_INFO } from '@/lib/itinerary-data';

export function ContactsTab() {
  return (
    <div className="space-y-6 pb-20">
      <div className="text-center py-4">
        <h2 className="font-display text-2xl text-foreground">Quick Contacts</h2>
        <p className="text-muted-foreground">Important numbers at your fingertips</p>
      </div>
      
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
    </div>
  );
}
