import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

interface FamilyContactCardProps {
  contact: FamilyContact;
  onEdit: (contact: FamilyContact) => void;
}

const categoryConfig: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  family: { label: 'Family', icon: Users, color: 'bg-primary/20 text-primary' },
  travel_party: { label: 'Travel Party', icon: User, color: 'bg-accent/20 text-accent' },
  local: { label: 'Local Contact', icon: MapPin, color: 'bg-secondary text-secondary-foreground' },
};

export function FamilyContactCard({ contact, onEdit }: FamilyContactCardProps) {
  const deleteContact = useDeleteFamilyContact();
  const config = categoryConfig[contact.category] || categoryConfig.family;
  const CategoryIcon = config.icon;

  return (
    <Card className="shadow-warm">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${config.color}`}>
            <CategoryIcon className="w-5 h-5" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold text-foreground">{contact.name}</h4>
              <Badge variant="secondary" className="text-xs">
                {config.label}
              </Badge>
            </div>
            
            {contact.relationship && (
              <p className="text-sm text-muted-foreground">{contact.relationship}</p>
            )}
            
            {contact.phone && (
              <a
                href={`tel:${contact.phone}`}
                className="inline-flex items-center gap-1 mt-2 text-sm text-accent hover:underline"
              >
                <Phone className="w-3 h-3" />
                {contact.phone}
              </a>
            )}
            
            {contact.emergency_info && (
              <div className="mt-2 p-2 rounded bg-destructive/10 text-sm">
                <div className="flex items-center gap-1 text-destructive font-medium">
                  <AlertCircle className="w-3 h-3" />
                  Emergency Info
                </div>
                <p className="text-muted-foreground mt-1">{contact.emergency_info}</p>
              </div>
            )}
            
            {contact.notes && (
              <p className="mt-2 text-sm text-muted-foreground italic">{contact.notes}</p>
            )}
          </div>
          
          <div className="flex gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(contact)}
              className="h-8 w-8"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Contact</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete {contact.name}? This action cannot be undone.
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
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
