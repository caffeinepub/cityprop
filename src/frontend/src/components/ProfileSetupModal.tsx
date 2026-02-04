import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useSaveCallerUserProfile, useSaveDriverProfile, useUploadDriverPhoto, useRequestApproval } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { toast } from 'sonner';
import { Loader2, MapPin, Upload, X, Mail, Car as CarIcon } from 'lucide-react';
import { UserProfile, DriverProfile, ExternalBlob, AppRole } from '../backend';

interface ProfileSetupModalProps {
  selectedRole: AppRole;
}

export default function ProfileSetupModal({ selectedRole }: ProfileSetupModalProps) {
  const { identity } = useInternetIdentity();
  const saveProfile = useSaveCallerUserProfile();
  const saveDriverProfile = useSaveDriverProfile();
  const uploadPhoto = useUploadDriverPhoto();
  const requestApproval = useRequestApproval();
  
  const isDriver = selectedRole === AppRole.driver;
  
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [carMake, setCarMake] = useState('');
  const [carModel, setCarModel] = useState('');
  const [carYear, setCarYear] = useState('');
  const [carColor, setCarColor] = useState('');
  const [carLicensePlate, setCarLicensePlate] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [backgroundCheckConfirmed, setBackgroundCheckConfirmed] = useState(false);
  const [preferredPayment, setPreferredPayment] = useState<'cash' | 'card'>('card');
  const [gettingLocation, setGettingLocation] = useState(false);
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [driverPhotoFile, setDriverPhotoFile] = useState<File | null>(null);
  const [driverPhotoPreview, setDriverPhotoPreview] = useState<string | null>(null);
  const [carPhotoFile, setCarPhotoFile] = useState<File | null>(null);
  const [carPhotoPreview, setCarPhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setGettingLocation(false);
        toast.success('Location captured successfully');
      },
      (error) => {
        setGettingLocation(false);
        toast.error('Failed to get location: ' + error.message);
      }
    );
  };

  const handleDriverPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      setDriverPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setDriverPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCarPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      setCarPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCarPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveDriverPhoto = () => {
    setDriverPhotoFile(null);
    setDriverPhotoPreview(null);
  };

  const handleRemoveCarPhoto = () => {
    setCarPhotoFile(null);
    setCarPhotoPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !phoneNumber.trim() || !address.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!coordinates) {
      toast.error('Please capture your location');
      return;
    }

    if (isDriver) {
      if (!carMake.trim() || !carModel.trim() || !carYear.trim() || !carColor.trim() || !carLicensePlate.trim() || !licenseNumber.trim()) {
        toast.error('Please enter all car information and driver\'s license number');
        return;
      }
      if (!ageConfirmed) {
        toast.error('You must be 18 years or older to register as a driver');
        return;
      }
      if (!backgroundCheckConfirmed) {
        toast.error('You must confirm that you have passed a background check');
        return;
      }
      if (!driverPhotoFile || !carPhotoFile) {
        toast.error('Please upload both driver photo and car photo');
        return;
      }
    }

    if (!identity) {
      toast.error('Not authenticated');
      return;
    }

    const userProfile: UserProfile = {
      name: name.trim(),
      userId: identity.getPrincipal(),
      phoneNumber: phoneNumber.trim(),
      userCoordinates: coordinates,
      isDriver,
      appRole: selectedRole,
    };

    try {
      await saveProfile.mutateAsync(userProfile);

      if (isDriver && driverPhotoFile) {
        setUploadingPhoto(true);
        
        const arrayBuffer = await driverPhotoFile.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        
        const photoBlob = ExternalBlob.fromBytes(bytes).withUploadProgress((percentage) => {
          console.log(`Upload progress: ${percentage}%`);
        });

        const carNumber = `${carMake} ${carModel} ${carYear} - ${carLicensePlate}`;

        const driverProfile: DriverProfile = {
          name: name.trim(),
          driverId: identity.getPrincipal(),
          carNumber: carNumber,
          driverCoordinates: coordinates,
          photo: photoBlob,
        };

        await saveDriverProfile.mutateAsync(driverProfile);
        await uploadPhoto.mutateAsync(photoBlob);
        await requestApproval.mutateAsync();
        
        setUploadingPhoto(false);
        
        toast.success('Driver profile created! Please email your full contact details, address, car info, driver\'s license, and work history to cityprop01@gmail.com for approval.');
      } else {
        toast.success('Profile created successfully!');
      }
    } catch (error: any) {
      setUploadingPhoto(false);
      toast.error('Failed to save profile: ' + error.message);
    }
  };

  const isSubmitting = saveProfile.isPending || saveDriverProfile.isPending || uploadingPhoto;

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Complete Your {isDriver ? 'Driver' : 'Customer'} Profile</DialogTitle>
          <DialogDescription>Please provide your information to get started</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <Input id="phone" type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+1 234 567 8900" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address *</Label>
            <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main St, City, State, ZIP" required />
          </div>

          {isDriver && (
            <>
              <Alert className="border-primary/30 bg-primary/5">
                <Mail className="h-4 w-4 text-primary" />
                <AlertDescription className="text-sm">
                  <strong>Driver Requirements:</strong> Drivers must be cleanly dressed with a clean car. After completing this form, email your full contact details, address, car info, driver's license, and work history to{' '}
                  <a href="mailto:cityprop01@gmail.com" className="font-semibold text-primary underline">
                    cityprop01@gmail.com
                  </a>{' '}
                  for approval. The company will email an application form and verify eligibility (18+, valid license, clean background).
                </AlertDescription>
              </Alert>

              <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <CarIcon className="h-4 w-4 text-primary" />
                  Car Information
                </h3>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="car-make">Car Make *</Label>
                    <Input id="car-make" value={carMake} onChange={(e) => setCarMake(e.target.value)} placeholder="Toyota" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="car-model">Car Model *</Label>
                    <Input id="car-model" value={carModel} onChange={(e) => setCarModel(e.target.value)} placeholder="Camry" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="car-year">Year *</Label>
                    <Input id="car-year" value={carYear} onChange={(e) => setCarYear(e.target.value)} placeholder="2020" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="car-color">Color *</Label>
                    <Input id="car-color" value={carColor} onChange={(e) => setCarColor(e.target.value)} placeholder="Silver" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="car-plate">License Plate *</Label>
                    <Input id="car-plate" value={carLicensePlate} onChange={(e) => setCarLicensePlate(e.target.value)} placeholder="ABC-1234" required />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="license">Driver's License Number *</Label>
                <Input id="license" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} placeholder="DL123456789" required />
              </div>

              <div className="space-y-3">
                <Label>Preferred Payment Method *</Label>
                <RadioGroup value={preferredPayment} onValueChange={(value) => setPreferredPayment(value as 'cash' | 'card')}>
                  <div className="flex items-center space-x-2 rounded-lg border-2 border-muted bg-background p-3">
                    <RadioGroupItem value="cash" id="pref-cash" />
                    <Label htmlFor="pref-cash" className="flex-1 cursor-pointer">Cash Deposit</Label>
                  </div>
                  <div className="flex items-center space-x-2 rounded-lg border-2 border-muted bg-background p-3">
                    <RadioGroupItem value="card" id="pref-card" />
                    <Label htmlFor="pref-card" className="flex-1 cursor-pointer">Card Deposit</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
                <div className="flex items-start gap-3">
                  <Checkbox id="age-confirm" checked={ageConfirmed} onCheckedChange={(checked) => setAgeConfirmed(checked === true)} />
                  <div className="space-y-1">
                    <Label htmlFor="age-confirm" className="cursor-pointer font-medium">
                      I confirm that I am 18 years or older *
                    </Label>
                    <p className="text-xs text-muted-foreground">You must be at least 18 years old to register as a driver</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox id="background-confirm" checked={backgroundCheckConfirmed} onCheckedChange={(checked) => setBackgroundCheckConfirmed(checked === true)} />
                  <div className="space-y-1">
                    <Label htmlFor="background-confirm" className="cursor-pointer font-medium">
                      I confirm that I have passed a background check *
                    </Label>
                    <p className="text-xs text-muted-foreground">Background verification is required for all drivers</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="driver-photo">Driver Photo *</Label>
                {driverPhotoPreview ? (
                  <div className="relative">
                    <img src={driverPhotoPreview} alt="Driver preview" className="h-32 w-32 rounded-lg object-cover border-2 border-primary/30" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -right-2 -top-2 h-6 w-6"
                      onClick={handleRemoveDriverPhoto}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Input
                      id="driver-photo"
                      type="file"
                      accept="image/*"
                      onChange={handleDriverPhotoChange}
                      className="hidden"
                    />
                    <Label
                      htmlFor="driver-photo"
                      className="flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                    >
                      <Upload className="h-4 w-4" />
                      Upload Driver Photo
                    </Label>
                    <span className="text-xs text-muted-foreground">Max 5MB</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="car-photo">Car Photo *</Label>
                {carPhotoPreview ? (
                  <div className="relative">
                    <img src={carPhotoPreview} alt="Car preview" className="h-32 w-32 rounded-lg object-cover border-2 border-primary/30" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -right-2 -top-2 h-6 w-6"
                      onClick={handleRemoveCarPhoto}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Input
                      id="car-photo"
                      type="file"
                      accept="image/*"
                      onChange={handleCarPhotoChange}
                      className="hidden"
                    />
                    <Label
                      htmlFor="car-photo"
                      className="flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                    >
                      <Upload className="h-4 w-4" />
                      Upload Car Photo
                    </Label>
                    <span className="text-xs text-muted-foreground">Max 5MB</span>
                  </div>
                )}
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label>Current Location *</Label>
            <Button type="button" onClick={handleGetLocation} disabled={gettingLocation || !!coordinates} variant="outline" className="w-full">
              {gettingLocation ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Getting Location...
                </>
              ) : coordinates ? (
                <>
                  <MapPin className="mr-2 h-4 w-4 text-green-600" />
                  Location Captured
                </>
              ) : (
                <>
                  <MapPin className="mr-2 h-4 w-4" />
                  Capture Location
                </>
              )}
            </Button>
            {coordinates && (
              <p className="text-xs text-muted-foreground">
                Lat: {coordinates.latitude.toFixed(6)}, Lng: {coordinates.longitude.toFixed(6)}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {uploadingPhoto ? 'Uploading Photos...' : 'Creating Profile...'}
              </>
            ) : (
              'Complete Setup'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
