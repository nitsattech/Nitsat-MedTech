'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, BedDouble, User, FileText, LogOut, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface IPDPatient {
  id: number;
  uhid: string;
  first_name: string;
  last_name?: string;
  phone?: string;
  registration_id: number;
  admission_date: string;
  consultant_name?: string;
  ward?: string;
  bed?: string;
  status: string;
}

export default function IPDWorkflowPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<IPDPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  // 🔥 Load admitted IPD patients automatically (professional behavior)
  const loadAdmittedPatients = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/registrations?type=IPD&status=Active');
      if (!res.ok) throw new Error();

      const data = await res.json();
      setPatients(Array.isArray(data) ? data : []);
    } catch {
      setError('Failed to load admitted IPD patients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmittedPatients();
  }, []);

  const filteredPatients = patients.filter((p) =>
    `${p.first_name} ${p.last_name || ''} ${p.uhid} ${p.phone || ''}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-bold text-slate-800 text-lg">IPD Management Dashboard</h1>
              <p className="text-xs text-slate-500">
                Admitted Patients • Bed Management • Billing • Discharge
              </p>
            </div>
          </div>

          {/* New Admission Button */}
          <Button onClick={() => router.push('/patient-registration')}>
            <Plus className="w-4 h-4 mr-2" />
            New IPD Admission
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 space-y-4">
        {/* Search + Stats */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="p-4">
            <p className="text-sm text-slate-500">Total Admitted</p>
            <p className="text-2xl font-bold text-blue-600">{patients.length}</p>
          </Card>

          <Card className="p-4">
            <p className="text-sm text-slate-500">Active IPD Cases</p>
            <p className="text-2xl font-bold text-green-600">
              {patients.filter(p => p.status === 'Active').length}
            </p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search UHID / Name / Phone"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </Card>
        </div>

        {error && (
          <Alert className="bg-destructive/10 border-destructive/20">
            <AlertDescription className="text-destructive text-sm">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Admitted Patients Table */}
        <Card className="p-4">
          <h2 className="font-semibold mb-4 text-slate-800">
            Admitted Patients (IPD)
          </h2>

          {loading ? (
            <p className="text-sm text-slate-500">Loading IPD patients...</p>
          ) : filteredPatients.length === 0 ? (
            <p className="text-sm text-slate-400">No admitted IPD patients found.</p>
          ) : (
            <div className="space-y-3">
              {filteredPatients.map((p) => (
                <div
                  key={p.registration_id}
                  className="border rounded-lg p-4 bg-white flex flex-col md:flex-row md:items-center md:justify-between hover:shadow-sm transition"
                >
                  {/* Patient Info */}
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-800 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {p.first_name} {p.last_name || ''}
                    </p>
                    <p className="text-xs text-slate-500">
                      UHID: {p.uhid} • Phone: {p.phone || '-'}
                    </p>
                    <p className="text-xs text-slate-500">
                      Admission: {p.admission_date} • Consultant: {p.consultant_name || 'Not Assigned'}
                    </p>
                    <p className="text-xs text-slate-500">
                      Ward: {p.ward || 'Not Allocated'} • Bed: {p.bed || 'Not Assigned'}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-3 md:mt-0 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/patients/${p.id}/case`)}
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      Case Dashboard
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/investigations?registrationId=${p.registration_id}`)}
                    >
                      Lab / Services
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/billing?registrationId=${p.registration_id}`)}
                    >
                      Billing
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => router.push(`/discharge?registrationId=${p.registration_id}`)}
                    >
                      <LogOut className="w-4 h-4 mr-1" />
                      Discharge
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}