'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface Department {
  id: number;
  name: string;
}

interface Patient {
  id: number;
  first_name: string;
  phone?: string;
}

export default function NewPatientRegistrationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    gender: '',
    date_of_birth: '',
    address: '',
    department_id: '',
  });

  const canSubmit = useMemo(() => form.first_name.trim() && form.phone.trim(), [form.first_name, form.phone]);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/departments');
      if (res.ok) {
        const data = await res.json();
        setDepartments(data || []);
      }
    })();
  }, []);

  const setField = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const createOrReusePatient = async () => {
    const searchRes = await fetch(`/api/patients?search=${encodeURIComponent(form.phone.trim())}`);
    if (searchRes.ok) {
      const existing = (await searchRes.json()) as Patient[];
      const exact = existing.find((p) => (p.phone || '').trim() === form.phone.trim() && p.first_name.toLowerCase() === form.first_name.trim().toLowerCase());
      if (exact) return exact.id;
    }

    const createRes = await fetch('/api/patients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim() || null,
        phone: form.phone.trim(),
        gender: form.gender || null,
        date_of_birth: form.date_of_birth || null,
        address: form.address.trim() || null,
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create patient');
    }

    const created = await createRes.json();
    return created.id as number;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    try {
      const patientId = await createOrReusePatient();
      toast.success('Patient registered successfully. Create visit to start clinical workflow.');
      router.push(`/patients/${patientId}/case`);
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/patients')} className="p-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Register New Patient</h1>
            <p className="text-xs text-muted-foreground">Fast reception flow. Register patient first, then create OPD/IPD visit from case dashboard.</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <Card className="p-6">
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">First Name *</label>
                <Input value={form.first_name} onChange={(e) => setField('first_name', e.target.value)} required />
              </div>
              <div>
                <label className="text-sm font-medium">Last Name</label>
                <Input value={form.last_name} onChange={(e) => setField('last_name', e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">Phone *</label>
                <Input value={form.phone} onChange={(e) => setField('phone', e.target.value)} required />
              </div>
              <div>
                <label className="text-sm font-medium">Gender</label>
                <select className="w-full h-10 border border-input bg-background rounded-md px-3" value={form.gender} onChange={(e) => setField('gender', e.target.value)}>
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">DOB</label>
                <Input type="date" value={form.date_of_birth} onChange={(e) => setField('date_of_birth', e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">Department</label>
                <select className="w-full h-10 border border-input bg-background rounded-md px-3" value={form.department_id} onChange={(e) => setField('department_id', e.target.value)}>
                  <option value="">Select Department</option>
                  {departments.map((d) => (<option key={d.id} value={d.id}>{d.name}</option>))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Address</label>
              <Input value={form.address} onChange={(e) => setField('address', e.target.value)} />
            </div>
            <Card className="p-3 bg-amber-50 border-amber-200"><p className="text-sm text-amber-800">Active visit required for clinical actions. After saving patient, create OPD/IPD visit inside Patient Case dashboard.</p></Card>

            <div className="pt-2">
              <Button type="submit" disabled={!canSubmit || loading} className="bg-primary hover:bg-primary/90">
                <UserPlus className="w-4 h-4 mr-2" />
                {loading ? 'Registering...' : 'Register Patient'}
              </Button>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
}
