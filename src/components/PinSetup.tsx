import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Waves, Sun, Shell, KeyRound, Loader2 } from 'lucide-react';
import { useCreatePin } from '@/hooks/use-trip-data';

interface PinSetupProps {
  onComplete: () => void;
}

export function PinSetup({ onComplete }: PinSetupProps) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const createPin = useCreatePin();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (pin.length < 4) {
      setError('PIN must be at least 4 digits');
      return;
    }

    if (pin.length > 8) {
      setError('PIN must be 8 digits or less');
      return;
    }

    if (!/^\d+$/.test(pin)) {
      setError('PIN must contain only numbers');
      return;
    }

    if (pin !== confirmPin) {
      setError('PINs do not match');
      return;
    }

    try {
      await createPin.mutateAsync(pin);
      onComplete();
    } catch (err) {
      setError('Failed to save PIN. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-beach-gradient flex flex-col items-center justify-center p-4">
      {/* Decorative elements */}
      <div className="absolute top-8 left-8 text-beach-sunset-coral opacity-50">
        <Sun className="w-12 h-12" />
      </div>
      <div className="absolute top-12 right-12 text-beach-ocean-light opacity-40">
        <Waves className="w-16 h-16" />
      </div>
      <div className="absolute bottom-16 left-16 text-beach-sand opacity-60">
        <Shell className="w-10 h-10" />
      </div>
      
      <Card className="w-full max-w-md shadow-warm-lg">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-sunset-gradient rounded-full flex items-center justify-center shadow-warm">
            <KeyRound className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-display text-foreground">
            Welcome to MyKeepsakes
          </CardTitle>
          <CardDescription className="text-body text-muted-foreground">
            Create a PIN to secure your trip planner. Share it with your family members.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="pin">Create a PIN (4-8 digits)</Label>
              <Input
                id="pin"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value.replace(/\D/g, '').slice(0, 8));
                  setError(null);
                }}
                placeholder="Enter PIN"
                className="text-center text-xl tracking-widest"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPin">Confirm PIN</Label>
              <Input
                id="confirmPin"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                value={confirmPin}
                onChange={(e) => {
                  setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 8));
                  setError(null);
                }}
                placeholder="Confirm PIN"
                className="text-center text-xl tracking-widest"
              />
            </div>
            
            {error && (
              <p className="text-sm text-destructive text-center animate-fade-in">
                {error}
              </p>
            )}
            
            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={createPin.isPending}
            >
              {createPin.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Setting up...
                </>
              ) : (
                'Create PIN & Continue'
              )}
            </Button>
          </form>
          
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Remember this PIN! You'll need it to access your trip. 🔐
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
