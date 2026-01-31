import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUpdatePin } from '@/hooks/use-trip-data';
import { LogOut, Key } from 'lucide-react';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPin: string;
  onLogout: () => void;
}

export function SettingsDialog({ open, onOpenChange, currentPin, onLogout }: SettingsDialogProps) {
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const updatePin = useUpdatePin();

  const handleUpdatePin = () => {
    if (newPin.length < 4) {
      setError('PIN must be at least 4 digits');
      return;
    }
    if (newPin !== confirmPin) {
      setError('PINs do not match');
      return;
    }
    
    updatePin.mutate(newPin, {
      onSuccess: () => {
        setNewPin('');
        setConfirmPin('');
        setError('');
      }
    });
  };

  const handleLogout = () => {
    sessionStorage.removeItem('ptown-authenticated');
    onLogout();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Settings</DialogTitle>
          <DialogDescription>
            Manage your trip planner settings
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Change PIN Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Key className="w-4 h-4" />
              Change PIN
            </div>
            
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="new-pin">New PIN</Label>
                <Input
                  id="new-pin"
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="Enter new PIN"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirm-pin">Confirm PIN</Label>
                <Input
                  id="confirm-pin"
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  placeholder="Confirm new PIN"
                />
              </div>
              
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              
              <Button 
                onClick={handleUpdatePin} 
                disabled={updatePin.isPending}
                className="w-full"
              >
                {updatePin.isPending ? 'Updating...' : 'Update PIN'}
              </Button>
            </div>
          </div>
          
          {/* Logout Section */}
          <div className="pt-4 border-t border-border">
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="w-full gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
            <p className="mt-2 text-xs text-center text-muted-foreground">
              You'll need to enter the PIN again to access the trip planner.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
