'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface RxRow {
  id: number;
  patient_id: number;
  registration_id: number;
  medicine_name: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  created_at: string;
  uhid: string;
  first_name: string;
  last_name?: string;
}

export default function PharmacyDashboardPage() {
  const router = useRouter();
  const [rows, setRows] = useState<RxRow[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/registrations?status=Active');
      if (!res.ok) return;
      const regs = await res.json();
      const visitRows: RxRow[] = [];
      await Promise.all(
        regs.slice(0, 100).map(async (reg: any) => {
          const flowRes = await fetch(`/api/opd-workflow?action=get-flow&registrationId=${reg.id}`);
          if (!flowRes.ok) return;
          const flow = await flowRes.json();
          (flow.prescriptions || []).forEach((rx: any) => {
            visitRows.push({
              id: rx.id,
              patient_id: reg.patient_id,
              registration_id: reg.id,
              medicine_name: rx.medicine_name,
              dosage: rx.dosage,
              frequency: rx.frequency,
              duration: rx.duration,
              created_at: rx.created_at,
              uhid: reg.uhid,
              first_name: reg.first_name,
              last_name: reg.last_name,
            });
          });
        })
      );
      setRows(visitRows.sort((a, b) => b.id - a.id));
    })();
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((row) =>
      [row.uhid, row.first_name, row.last_name, row.medicine_name]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(term)
    );
  }, [rows, search]);

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Pharmacy Dashboard</h1>
          <p className="text-sm text-muted-foreground">Visit-wise prescriptions. Dispensing and pharmacy charges are handled inside case dashboard.</p>
        </div>
        <Button variant="outline" onClick={() => router.push('/patients')}>Patients</Button>
      </div>

      <Input placeholder="Search by UHID, patient, medicine" value={search} onChange={(e) => setSearch(e.target.value)} />

      <Card className="p-4 space-y-2">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">No prescriptions found for active visits.</p>
        ) : (
          filtered.map((row) => (
            <div key={row.id} className="border rounded p-2 flex items-center justify-between text-sm">
              <div>
                <p className="font-medium">{row.medicine_name}</p>
                <p className="text-muted-foreground">
                  {row.uhid} · {row.first_name} {row.last_name || ''} · Visit #{row.registration_id}
                  {row.dosage ? ` · ${row.dosage}` : ''}
                </p>
              </div>
              <Button size="sm" onClick={() => router.push(`/patients/${row.patient_id}/case?tab=pharmacy`)}>Open Case</Button>
            </div>
          ))
        )}
      </Card>
    </main>
  );
}
