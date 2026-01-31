import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAddLodging, useUpdateLodging, LodgingOption, LodgingInsert } from '@/hooks/use-lodging';
import { Loader2, Plus, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PTOWN_CENTER } from '@/lib/itinerary-data';

interface LodgingEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingLodging?: LodgingOption | null;
}

export function LodgingEditor({ open, onOpenChange, editingLodging }: LodgingEditorProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [pricePerNight, setPricePerNight] = useState('');
  const [totalPrice, setTotalPrice] = useState('');
  const [url, setUrl] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [maxGuests, setMaxGuests] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [notes, setNotes] = useState('');
  const [amenities, setAmenities] = useState<string[]>([]);
  const [pros, setPros] = useState<string[]>([]);
  const [cons, setCons] = useState<string[]>([]);
  const [newAmenity, setNewAmenity] = useState('');
  const [newPro, setNewPro] = useState('');
  const [newCon, setNewCon] = useState('');

  const addLodging = useAddLodging();
  const updateLodging = useUpdateLodging();

  const isEditing = !!editingLodging;
  const isPending = addLodging.isPending || updateLodging.isPending;

  useEffect(() => {
    if (editingLodging) {
      setName(editingLodging.name);
      setDescription(editingLodging.description || '');
      setAddress(editingLodging.address || '');
      setPricePerNight(editingLodging.price_per_night?.toString() || '');
      setTotalPrice(editingLodging.total_price?.toString() || '');
      setUrl(editingLodging.url || '');
      setBedrooms(editingLodging.bedrooms?.toString() || '');
      setBathrooms(editingLodging.bathrooms?.toString() || '');
      setMaxGuests(editingLodging.max_guests?.toString() || '');
      setLat(editingLodging.location_lat?.toString() || '');
      setLng(editingLodging.location_lng?.toString() || '');
      setNotes(editingLodging.notes || '');
      setAmenities(editingLodging.amenities || []);
      setPros(editingLodging.pros || []);
      setCons(editingLodging.cons || []);
    } else {
      resetForm();
    }
  }, [editingLodging, open]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setAddress('');
    setPricePerNight('');
    setTotalPrice('');
    setUrl('');
    setBedrooms('');
    setBathrooms('');
    setMaxGuests('');
    setLat(PTOWN_CENTER.lat.toString());
    setLng(PTOWN_CENTER.lng.toString());
    setNotes('');
    setAmenities([]);
    setPros([]);
    setCons([]);
    setNewAmenity('');
    setNewPro('');
    setNewCon('');
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;

    const lodgingData: LodgingInsert = {
      name: name.trim(),
      description: description.trim() || null,
      address: address.trim() || null,
      price_per_night: pricePerNight ? parseFloat(pricePerNight) : null,
      total_price: totalPrice ? parseFloat(totalPrice) : null,
      url: url.trim() || null,
      bedrooms: bedrooms ? parseInt(bedrooms) : null,
      bathrooms: bathrooms ? parseFloat(bathrooms) : null,
      max_guests: maxGuests ? parseInt(maxGuests) : null,
      location_lat: lat ? parseFloat(lat) : null,
      location_lng: lng ? parseFloat(lng) : null,
      notes: notes.trim() || null,
      amenities: amenities.length > 0 ? amenities : null,
      pros: pros.length > 0 ? pros : null,
      cons: cons.length > 0 ? cons : null,
    };

    if (isEditing) {
      await updateLodging.mutateAsync({ id: editingLodging.id, updates: lodgingData });
    } else {
      await addLodging.mutateAsync(lodgingData);
    }
    
    onOpenChange(false);
    resetForm();
  };

  const addToList = (list: string[], setList: (v: string[]) => void, value: string, setValue: (v: string) => void) => {
    if (value.trim()) {
      setList([...list, value.trim()]);
      setValue('');
    }
  };

  const removeFromList = (list: string[], setList: (v: string[]) => void, index: number) => {
    setList(list.filter((_, i) => i !== index));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEditing ? 'Edit Lodging' : 'Add Lodging Option'}</SheetTitle>
          <SheetDescription>
            {isEditing 
              ? 'Update the details for this accommodation.' 
              : 'Add a potential accommodation to compare with others.'}
          </SheetDescription>
        </SheetHeader>

        <div className="grid gap-4 py-4">
          {/* Basic Info */}
          <div className="grid gap-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Beach House on Commercial St"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Charming cottage with ocean views..."
              rows={2}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Commercial Street, Provincetown, MA"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="url">Listing URL</Label>
            <Input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://airbnb.com/rooms/..."
            />
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="pricePerNight">Price/Night ($)</Label>
              <Input
                id="pricePerNight"
                type="number"
                value={pricePerNight}
                onChange={(e) => setPricePerNight(e.target.value)}
                placeholder="250"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="totalPrice">Total Price ($)</Label>
              <Input
                id="totalPrice"
                type="number"
                value={totalPrice}
                onChange={(e) => setTotalPrice(e.target.value)}
                placeholder="1750"
              />
            </div>
          </div>

          {/* Specs */}
          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="bedrooms">Bedrooms</Label>
              <Input
                id="bedrooms"
                type="number"
                value={bedrooms}
                onChange={(e) => setBedrooms(e.target.value)}
                placeholder="3"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bathrooms">Bathrooms</Label>
              <Input
                id="bathrooms"
                type="number"
                step="0.5"
                value={bathrooms}
                onChange={(e) => setBathrooms(e.target.value)}
                placeholder="2"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="maxGuests">Max Guests</Label>
              <Input
                id="maxGuests"
                type="number"
                value={maxGuests}
                onChange={(e) => setMaxGuests(e.target.value)}
                placeholder="8"
              />
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="lat">Latitude</Label>
              <Input
                id="lat"
                type="number"
                step="0.0001"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="42.0584"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lng">Longitude</Label>
              <Input
                id="lng"
                type="number"
                step="0.0001"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                placeholder="-70.1836"
              />
            </div>
          </div>

          {/* Amenities */}
          <div className="grid gap-2">
            <Label>Amenities</Label>
            <div className="flex gap-2">
              <Input
                value={newAmenity}
                onChange={(e) => setNewAmenity(e.target.value)}
                placeholder="WiFi, Parking, Beach Access..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addToList(amenities, setAmenities, newAmenity, setNewAmenity);
                  }
                }}
              />
              <Button 
                type="button" 
                size="icon" 
                variant="outline"
                onClick={() => addToList(amenities, setAmenities, newAmenity, setNewAmenity)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {amenities.map((a, i) => (
                <Badge key={i} variant="secondary" className="gap-1">
                  {a}
                  <button onClick={() => removeFromList(amenities, setAmenities, i)}>
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Pros */}
          <div className="grid gap-2">
            <Label>Pros</Label>
            <div className="flex gap-2">
              <Input
                value={newPro}
                onChange={(e) => setNewPro(e.target.value)}
                placeholder="Close to beach, great reviews..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addToList(pros, setPros, newPro, setNewPro);
                  }
                }}
              />
              <Button 
                type="button" 
                size="icon" 
                variant="outline"
                onClick={() => addToList(pros, setPros, newPro, setNewPro)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {pros.map((p, i) => (
                <Badge key={i} variant="default" className="gap-1 bg-green-500/20 text-green-700 hover:bg-green-500/30">
                  ✓ {p}
                  <button onClick={() => removeFromList(pros, setPros, i)}>
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Cons */}
          <div className="grid gap-2">
            <Label>Cons</Label>
            <div className="flex gap-2">
              <Input
                value={newCon}
                onChange={(e) => setNewCon(e.target.value)}
                placeholder="No parking, small kitchen..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addToList(cons, setCons, newCon, setNewCon);
                  }
                }}
              />
              <Button 
                type="button" 
                size="icon" 
                variant="outline"
                onClick={() => addToList(cons, setCons, newCon, setNewCon)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {cons.map((c, i) => (
                <Badge key={i} variant="destructive" className="gap-1 bg-red-500/20 text-red-700 hover:bg-red-500/30">
                  ✗ {c}
                  <button onClick={() => removeFromList(cons, setCons, i)}>
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="grid gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes about this place..."
              rows={2}
            />
          </div>
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || isPending}>
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEditing ? 'Save Changes' : 'Add Lodging'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
