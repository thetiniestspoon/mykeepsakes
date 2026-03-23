import { useState, useRef, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useCreateConnection } from '@/hooks/use-connections';

interface ConnectionCaptureSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string;
  currentDayId?: string;
}

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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>New Connection</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-4 mt-4 pb-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="conn-name">Name *</Label>
            <Input
              id="conn-name"
              ref={nameRef}
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="conn-org">Role / Organization</Label>
            <Input
              id="conn-org"
              placeholder="Title or company"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="conn-context">How you met</Label>
            <Textarea
              id="conn-context"
              placeholder="Where and how did you connect?"
              value={metContext}
              onChange={(e) => setMetContext(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="conn-email">Email</Label>
            <Input
              id="conn-email"
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="conn-phone">Phone</Label>
            <Input
              id="conn-phone"
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <Button
            onClick={handleSave}
            disabled={!name.trim() || isPending}
            className="w-full mt-2"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              'Save Connection'
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
