import { Phone } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { ContactsTab } from '@/components/ContactsTab';
import '@/preview/collage/collage.css';
import { Stamp } from '@/preview/collage/ui/Stamp';

/**
 * Floating contacts action — migrated to Collage 2026-04-23 (Phase 4 #1).
 * Sharp rounded-sm button with ink surface + crème icon; pen-blue focus ring.
 * Drawer content slot wraps in .collage-root so ContactsTab inherits tokens.
 * Logic unchanged (Drawer open/close handled by shadcn primitive).
 */
export function ContactsFAB() {
  return (
    <Drawer direction="right">
      <DrawerTrigger asChild>
        <button
          type="button"
          aria-label="Open contacts"
          style={{
            appearance: 'none',
            cursor: 'pointer',
            width: 32,
            height: 32,
            display: 'grid',
            placeItems: 'center',
            background: 'var(--c-ink)',
            color: 'var(--c-creme)',
            border: '1px solid var(--c-ink)',
            borderRadius: 'var(--c-r-sm)',
            boxShadow: 'var(--c-shadow-sm)',
            transition: 'background var(--c-t-fast) var(--c-ease-out), transform var(--c-t-fast) var(--c-ease-out)',
          }}
          onFocus={(e) => {
            e.currentTarget.style.boxShadow = '0 0 0 2px var(--c-pen), var(--c-shadow-sm)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.boxShadow = 'var(--c-shadow-sm)';
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'var(--c-pen)';
            e.currentTarget.style.borderColor = 'var(--c-pen)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'var(--c-ink)';
            e.currentTarget.style.borderColor = 'var(--c-ink)';
          }}
        >
          <Phone size={16} strokeWidth={1.75} aria-hidden />
          <span className="sr-only">Contacts</span>
        </button>
      </DrawerTrigger>
      <DrawerContent className="h-full w-80 ml-auto">
        <div
          className="collage-root"
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            minHeight: 0,
            background: 'var(--c-creme)',
          }}
        >
          <DrawerHeader
            style={{
              borderBottom: '1px solid var(--c-line)',
              padding: '16px 16px 14px',
              background: 'var(--c-paper)',
              position: 'relative',
            }}
          >
            <Stamp variant="ink" size="sm" rotate={-2} style={{ marginBottom: 4, alignSelf: 'start' }}>
              quick contacts
            </Stamp>
            <DrawerTitle
              style={{
                fontFamily: 'var(--c-font-body)',
                fontSize: 18,
                fontWeight: 500,
                color: 'var(--c-ink)',
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              Who to reach
            </DrawerTitle>
          </DrawerHeader>
          <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
            <ContactsTab />
          </div>
          <style>{`
            @media (prefers-reduced-motion: reduce) {
              .collage-root button {
                transition: none !important;
              }
            }
          `}</style>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
