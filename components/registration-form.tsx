'use client';

import { useState, useEffect } from 'react';
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
import { Loader2, CheckCircle } from 'lucide-react';

interface Department {
  id: number;
  name: string;
}

interface RegistrationFormProps {
  patientId: number;
  onSuccess: () => void;
}

export default function RegistrationFormComponent({ patientId, onSuccess }: RegistrationFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [formData, setFormData] = useState({
    registration_type: 'IPD',
    department_id: '',
    doctor_id: '',
    admission_date: new Date().toISOString().split('T')[0],
    admission_time: '',
    guardian_name: '',
    guardian_relation: '',
    guardian_phone: '',
    insurance_company: '',
    insurance_number: '',
    rate_list: 'COMMON',
    provisional_diagnosis: '',
    procedure_treatment: '',
    comments: ''
  });

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await fetch('/api/departments');
        if (response.ok) {
          const data = await response.json();
          setDepartments(data);
        }
      } catch (error) {
        console.error('Error fetching departments:', error);
      }
    };

    fetchDepartments();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const response = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patientId,
          ...formData,
          department_id: formData.department_id ? parseInt(formData.department_id) : null
        })
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to create registration');
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
      
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="p-8 text-center space-y-4">
        <div className="flex justify-center">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Registration Successful!</h2>
        <p className="text-muted-foreground">Patient has been registered. Redirecting...</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold text-foreground mb-6">Patient Registration Details</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Registration Information */}
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground">Registration Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">Registration Type *</label>
              <Select value={formData.registration_type} onValueChange={(value) => handleSelectChange('registration_type', value)}>
                <SelectTrigger disabled={loading}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IPD">IPD (In-Patient)</SelectItem>
                  <SelectItem value="OPD">OPD (Out-Patient)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">Department</label>
              <Select value={formData.department_id} onValueChange={(value) => handleSelectChange('department_id', value)}>
                <SelectTrigger disabled={loading}>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map(dept => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">Admission Date *</label>
              <Input
                name="admission_date"
                type="date"
                value={formData.admission_date}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">Admission Time</label>
              <Input
                name="admission_time"
                type="time"
                value={formData.admission_time}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">Rate List</label>
            <Select value={formData.rate_list} onValueChange={(value) => handleSelectChange('rate_list', value)}>
              <SelectTrigger disabled={loading}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="COMMON">COMMON</SelectItem>
                <SelectItem value="GOVT">GOVT</SelectItem>
                <SelectItem value="PRIVATE">PRIVATE</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Guardian Information */}
        <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
          <h3 className="font-semibold text-foreground">Guardian Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">Guardian Name</label>
              <Input
                name="guardian_name"
                value={formData.guardian_name}
                onChange={handleChange}
                placeholder="Name"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">Relation</label>
              <Input
                name="guardian_relation"
                value={formData.guardian_relation}
                onChange={handleChange}
                placeholder="Father/Mother/Spouse"
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">Guardian Phone</label>
            <Input
              name="guardian_phone"
              type="tel"
              value={formData.guardian_phone}
              onChange={handleChange}
              placeholder="+91 9999999999"
              disabled={loading}
            />
          </div>
        </div>

        {/* Insurance Information */}
        <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
          <h3 className="font-semibold text-foreground">Insurance Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">Insurance Company</label>
              <Input
                name="insurance_company"
                value={formData.insurance_company}
                onChange={handleChange}
                placeholder="Company Name"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">Policy Number</label>
              <Input
                name="insurance_number"
                value={formData.insurance_number}
                onChange={handleChange}
                placeholder="Policy #"
                disabled={loading}
              />
            </div>
          </div>
        </div>

        {/* Medical Information */}
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground">Medical Information</h3>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">Provisional Diagnosis</label>
            <textarea
              name="provisional_diagnosis"
              value={formData.provisional_diagnosis}
              onChange={handleChange}
              placeholder="Enter provisional diagnosis..."
              disabled={loading}
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">Procedure/Treatment</label>
            <textarea
              name="procedure_treatment"
              value={formData.procedure_treatment}
              onChange={handleChange}
              placeholder="Enter procedure/treatment plan..."
              disabled={loading}
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">Comments/Remarks</label>
            <textarea
              name="comments"
              value={formData.comments}
              onChange={handleChange}
              placeholder="Enter any additional comments..."
              disabled={loading}
              rows={2}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
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
              Registering...
            </>
          ) : (
            'Complete Registration'
          )}
        </Button>
      </form>
    </Card>
  );
}
