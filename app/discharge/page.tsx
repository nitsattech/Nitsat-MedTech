'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Search, LogOut, ReceiptText, CheckCircle2, ClipboardCheck } from 'lucide-react';

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
  bill_id?: number;
  bill_number?: string;
  bill_total_amount?: number;
  bill_deposit_paid?: number;
  bill_amount_due?: number;
  bill_status?: string;
  pharmacy_clearance?: number;
  doctor_summary_complete?: number;
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
    } catch {
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

  const updateClearance = async (row: RegistrationRow, field: 'pharmacy_clearance' | 'doctor_summary_complete') => {
    setSavingId(row.id);
    setError('');

    const nextPharmacy = field === 'pharmacy_clearance' ? (row.pharmacy_clearance ? 0 : 1) : (row.pharmacy_clearance || 0);
    const nextDoctor = field === 'doctor_summary_complete' ? (row.doctor_summary_complete ? 0 : 1) : (row.doctor_summary_complete || 0);

    try {
      const response = await fetch(`/api/registrations/${row.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-clearance',
          pharmacy_clearance: nextPharmacy === 1,
          doctor_summary_complete: nextDoctor === 1,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Could not update discharge checklist.');
        return;
      }

      setRows((prev) => prev.map((item) => (
        item.id === row.id
          ? {
              ...item,
              pharmacy_clearance: Number(data.pharmacy_clearance || nextPharmacy),
              doctor_summary_complete: Number(data.doctor_summary_complete || nextDoctor),
              bill_status: data.bill_status || item.bill_status,
              bill_amount_due: Number(data.amount_due ?? item.bill_amount_due ?? 0),
            }
          : item
      )));
    } catch {
      setError('Could not update discharge checklist.');
    } finally {
      setSavingId(null);
    }
  };

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

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Failed to discharge patient');
        return;
      }

      setRows((prev) => prev.filter((row) => row.id !== id));
      router.push(`/billing?registrationId=${id}&autoPrint=1`);
    } catch {
      setError('Could not complete discharge right now.');
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
            <p className="text-xs text-muted-foreground">Discharge only after Pharmacy Clearance + Doctor Summary + Billing Paid.</p>
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
                <th className="px-4 py-3 text-left">Checklist</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="px-4 py-8 text-center text-muted-foreground" colSpan={5}>Loading active admissions…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td className="px-4 py-8 text-center text-muted-foreground" colSpan={5}>No active admissions found.</td></tr>
              ) : (
                filtered.map((row) => {
                  const pharmacyDone = Number(row.pharmacy_clearance || 0) === 1;
                  const doctorDone = Number(row.doctor_summary_complete || 0) === 1;
                  const billingDone = row.bill_status === 'Paid' && Number(row.bill_amount_due || 0) <= 0;
                  const canDischarge = pharmacyDone && doctorDone && billingDone;

                  return (
                    <tr key={row.id} className="border-b hover:bg-muted/20">
                      <td className="px-4 py-3 font-mono text-xs">{row.uhid}</td>
                      <td className="px-4 py-3">
                        {row.first_name} {row.last_name || ''}
                        <div className="text-xs text-muted-foreground">{row.phone || '-'} • {row.dept_name || '-'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <p>{row.admission_date}</p>
                        <p className="text-xs text-muted-foreground">Consultant: {row.consultant_name || '-'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1.5 min-w-[320px]">
                          <div className="flex gap-2 items-center">
                            <Button size="sm" variant={pharmacyDone ? 'default' : 'outline'} onClick={() => updateClearance(row, 'pharmacy_clearance')} disabled={savingId === row.id}>
                              <ClipboardCheck className="w-4 h-4 mr-1" />{pharmacyDone ? 'Pharmacy Cleared' : 'Mark Pharmacy'}
                            </Button>
                            <span className={`text-xs font-semibold ${pharmacyDone ? 'text-green-600' : 'text-orange-600'}`}>{pharmacyDone ? 'Done' : 'Pending'}</span>
                          </div>
                          <div className="flex gap-2 items-center">
                            <Button size="sm" variant={doctorDone ? 'default' : 'outline'} onClick={() => updateClearance(row, 'doctor_summary_complete')} disabled={savingId === row.id}>
                              <CheckCircle2 className="w-4 h-4 mr-1" />{doctorDone ? 'Doctor Summary Done' : 'Mark Doctor Summary'}
                            </Button>
                            <span className={`text-xs font-semibold ${doctorDone ? 'text-green-600' : 'text-orange-600'}`}>{doctorDone ? 'Done' : 'Pending'}</span>
                          </div>
                          <p className={`text-xs font-semibold ${billingDone ? 'text-green-600' : 'text-orange-600'}`}>
                            Billing: {row.bill_id ? `${row.bill_status || 'Unpaid'} (Due ₹${Number(row.bill_amount_due || 0).toFixed(2)})` : 'Bill not created'}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/billing?registrationId=${row.id}&autoPrint=1`)}
                          >
                            <ReceiptText className="w-4 h-4 mr-1" />
                            {row.bill_id ? 'Open Bill' : 'Create Bill'}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => markDischarged(row.id)}
                            disabled={savingId === row.id || !canDischarge}
                          >
                            <LogOut className="w-4 h-4 mr-1" />
                            {savingId === row.id ? 'Processing...' : 'Discharge'}
                          </Button>
                        </div>
                        {!canDischarge && (
                          <p className="text-[11px] text-orange-600 mt-1">
                            Complete all 3 checks before discharge.
                          </p>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </Card>
      </main>
    </div>
  );
}
