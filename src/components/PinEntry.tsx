import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Waves, Sun, Heart, Shell } from 'lucide-react';

interface PinEntryProps {
  correctPin: string;
  onSuccess: () => void;
}

export function PinEntry({ correctPin, onSuccess }: PinEntryProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (pin === correctPin) {
      // Store session
      sessionStorage.setItem('ptown-authenticated', 'true');
      onSuccess();
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setTimeout(() => setError(false), 2000);
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
      
      <Card className={`w-full max-w-md shadow-warm-lg transition-all ${shake ? 'animate-shake' : ''}`}>
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-sunset-gradient rounded-full flex items-center justify-center shadow-warm">
            <Heart className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-display text-foreground">
            MyKeepsakes
          </CardTitle>
          <CardDescription className="text-body text-muted-foreground">
            Your trip companion
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="pin" className="text-sm font-medium text-foreground">
                Enter your family PIN
              </label>
              <Input
                id="pin"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••••••"
                className={`text-center text-xl tracking-widest ${error ? 'border-destructive ring-destructive' : ''}`}
                autoFocus
              />
              {error && (
                <p className="text-sm text-destructive text-center animate-fade-in">
                  Incorrect PIN. Please try again.
                </p>
              )}
            </div>
            
            <Button type="submit" className="w-full" size="lg">
              Enter Trip Planner
            </Button>
          </form>
          
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Your vacation adventure awaits! 🌊
          </p>
        </CardContent>
      </Card>
      
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}
