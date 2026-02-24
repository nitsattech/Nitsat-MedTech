'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, CheckCircle, User, Copy } from 'lucide-react';

interface PatientFormProps {
  onPatientCreated: (patient: any) => void;
}

export default function PatientFormComponent({ onPatientCreated }: PatientFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdPatient, setCreatedPatient] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pin_code: '',
    blood_group: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const copyUHID = () => {
    if (createdPatient?.uhid) {
      navigator.clipboard.writeText(createdPatient.uhid);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to create patient');
        setLoading(false);
        return;
      }

      const patient = await response.json();
      setCreatedPatient(patient);
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Success screen
  if (createdPatient) {
    return (
      <Card className="p-8">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground">Patient Registered Successfully!</h2>
            <p className="text-muted-foreground mt-1">A unique ID has been assigned to this patient</p>
          </div>

          {/* UHID Card */}
          <div className="bg-primary/5 border-2 border-primary/30 rounded-xl p-6 max-w-sm mx-auto">
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide mb-2">Unique Patient ID (UHID)</p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl font-bold font-mono text-primary">{createdPatient.uhid}</span>
              <button
                onClick={copyUHID}
                className="p-2 rounded-lg hover:bg-primary/10 transition-colors"
                title="Copy UHID"
              >
                <Copy className={`w-5 h-5 ${copied ? 'text-green-600' : 'text-muted-foreground'}`} />
              </button>
            </div>
            {copied && <p className="text-xs text-green-600 mt-1">Copied!</p>}
          </div>

          {/* Patient Summary */}
          <div className="bg-muted/50 rounded-lg p-4 text-left max-w-sm mx-auto space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="font-semibold text-foreground">{createdPatient.first_name} {createdPatient.last_name || ''}</span>
            </div>
            {createdPatient.gender && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Gender</span>
                <span className="text-foreground">{createdPatient.gender}</span>
              </div>
            )}
            {createdPatient.date_of_birth && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Date of Birth</span>
                <span className="text-foreground">{createdPatient.date_of_birth}</span>
              </div>
            )}
            {createdPatient.phone && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Phone</span>
                <span className="text-foreground">{createdPatient.phone}</span>
              </div>
            )}
            {createdPatient.blood_group && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Blood Group</span>
                <span className="text-foreground font-medium">{createdPatient.blood_group}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => onPatientCreated(createdPatient)}
              className="bg-primary hover:bg-primary/90"
            >
              Proceed to Registration
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setCreatedPatient(null);
                setFormData({
                  first_name: '', last_name: '', date_of_birth: '', gender: '',
                  phone: '', email: '', address: '', city: '', state: '', pin_code: '', blood_group: ''
                });
              }}
            >
              Register Another Patient
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold text-foreground mb-6">New Patient Registration</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground">Personal Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">First Name *</label>
              <Input
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                required
                placeholder="John"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">Last Name</label>
              <Input
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Doe"
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">Date of Birth</label>
              <Input
                name="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">Gender</label>
              <Select value={formData.gender} onValueChange={(value) => handleSelectChange('gender', value)}>
                <SelectTrigger disabled={loading}>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">Blood Group</label>
              <Select value={formData.blood_group} onValueChange={(value) => handleSelectChange('blood_group', value)}>
                <SelectTrigger disabled={loading}>
                  <SelectValue placeholder="Select blood group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="O+">O+</SelectItem>
                  <SelectItem value="O-">O-</SelectItem>
                  <SelectItem value="A+">A+</SelectItem>
                  <SelectItem value="A-">A-</SelectItem>
                  <SelectItem value="B+">B+</SelectItem>
                  <SelectItem value="B-">B-</SelectItem>
                  <SelectItem value="AB+">AB+</SelectItem>
                  <SelectItem value="AB-">AB-</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">Phone</label>
              <Input
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 9999999999"
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">Email</label>
            <Input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="patient@example.com"
              disabled={loading}
            />
          </div>
        </div>

        {/* Address Information */}
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground">Address</h3>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">Address</label>
            <Input
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="123 Main Street"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">City</label>
              <Input
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Mumbai"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">State</label>
              <Input
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="Maharashtra"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">Pin Code</label>
              <Input
                name="pin_code"
                value={formData.pin_code}
                onChange={handleChange}
                placeholder="400001"
                disabled={loading}
              />
            </div>
          </div>
        </div>

        {error && (
          <Alert className="bg-destructive/10 border-destructive/20">
            <AlertDescription className="text-destructive text-sm">{error}</AlertDescription>
          </Alert>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-primary hover:bg-primary/90"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating Patient...
            </>
          ) : (
            'Create Patient'
          )}
        </Button>
      </form>
    </Card>
  );
}