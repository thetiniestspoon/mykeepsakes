import { Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { ContactsTab } from '@/components/ContactsTab';

/**
 * Floating action button for contacts that opens a slide-out drawer
 * Used in the compact dashboard header
 */
export function ContactsFAB() {
  return (
    <Drawer direction="right">
      <DrawerTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Phone className="w-4 h-4" />
          <span className="sr-only">Contacts</span>
        </Button>
      </DrawerTrigger>
      <DrawerContent className="h-full w-80 ml-auto rounded-l-xl">
        <DrawerHeader className="border-b border-border">
          <DrawerTitle>Quick Contacts</DrawerTitle>
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto p-4">
          <ContactsTab />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
