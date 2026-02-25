'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Search, LogOut, ReceiptText } from 'lucide-react';

interface RegistrationRow {
  id: number;
  registration_type: string;
  admission_date: string;
  discharge_date?: string;
  status: string;
  uhid: string;
  first_name: string;
  last_name?: string;
  phone?: string;
  dept_name?: string;
  consultant_name?: string;
}

export default function DischargePage() {
  const router = useRouter();
  const [rows, setRows] = useState<RegistrationRow[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const loadRows = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/registrations?status=Active&limit=500');
      if (!response.ok) throw new Error('Failed to load active registrations');
      const data = await response.json();
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Unable to load active registrations right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRows();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((item) =>
      [item.uhid, item.first_name, item.last_name, item.phone, item.dept_name, item.consultant_name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }, [rows, search]);

  const markDischarged = async (id: number) => {
    setSavingId(id);
    setError('');
    try {
      const response = await fetch(`/api/registrations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'Discharged',
          discharge_date: new Date().toISOString().slice(0, 10),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to discharge patient');
      }

      setRows((prev) => prev.filter((row) => row.id !== id));
      router.push(`/billing?registrationId=${id}`);
    } catch (err) {
      setError('Could not complete discharge. Please try again.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')} className="p-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Discharge Management</h1>
            <p className="text-xs text-muted-foreground">Finalize patient discharge and continue to billing clearance.</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-4">
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by UHID, patient name, mobile, consultant..."
                className="pl-9"
              />
            </div>
            <Button variant="outline" onClick={loadRows} disabled={loading}>Refresh</Button>
          </div>
        </Card>

        {error && (
          <Alert className="bg-destructive/10 border-destructive/20">
            <AlertDescription className="text-destructive text-sm">{error}</AlertDescription>
          </Alert>
        )}

        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-4 py-3 text-left">UHID</th>
                <th className="px-4 py-3 text-left">Patient</th>
                <th className="px-4 py-3 text-left">Admission</th>
                <th className="px-4 py-3 text-left">Department</th>
                <th className="px-4 py-3 text-left">Consultant</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="px-4 py-8 text-center text-muted-foreground" colSpan={6}>Loading active admissions…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td className="px-4 py-8 text-center text-muted-foreground" colSpan={6}>No active admissions found.</td></tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row.id} className="border-b hover:bg-muted/20">
                    <td className="px-4 py-3 font-mono text-xs">{row.uhid}</td>
                    <td className="px-4 py-3">{row.first_name} {row.last_name || ''}<div className="text-xs text-muted-foreground">{row.phone || '-'}</div></td>
                    <td className="px-4 py-3">{row.admission_date}</td>
                    <td className="px-4 py-3">{row.dept_name || '-'}</td>
                    <td className="px-4 py-3">{row.consultant_name || '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/billing?registrationId=${row.id}`)}
                        >
                          <ReceiptText className="w-4 h-4 mr-1" />Billing
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => markDischarged(row.id)}
                          disabled={savingId === row.id}
                        >
                          <LogOut className="w-4 h-4 mr-1" />
                          {savingId === row.id ? 'Processing...' : 'Discharge'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      </main>
    </div>
  );
}
