'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface LabOrderRow {
  id: number;
  registration_id: number;
  patient_id: number;
  status: string;
  test_name: string;
  report_url?: string;
  created_at: string;
  uhid: string;
  first_name: string;
  last_name?: string;
}

export default function InvestigationDashboardPage() {
  const router = useRouter();
  const [rows, setRows] = useState<LabOrderRow[]>([]);
  const [search, setSearch] = useState('');
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/opd-workflow?action=lab-dashboard&visitDate=${today}`);
      if (res.ok) {
        setRows(await res.json());
      }
    })();
  }, [today]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((row) =>
      [row.uhid, row.first_name, row.last_name, row.test_name, row.status]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(term)
    );
  }, [rows, search]);

  const grouped = {
    pending: filtered.filter((row) => ['Ordered', 'Pending'].includes(row.status)),
    sampleCollected: filtered.filter((row) => row.status === 'Sample Collected'),
    completed: filtered.filter((row) => ['Completed', 'Report Uploaded'].includes(row.status)),
  };

  const renderSection = (title: string, items: LabOrderRow[]) => (
    <Card className="p-4 space-y-2">
      <p className="font-semibold">{title} ({items.length})</p>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No records.</p>
      ) : (
        items.map((row) => (
          <div key={row.id} className="border rounded p-2 flex items-center justify-between text-sm">
            <div>
              <p className="font-medium">{row.test_name}</p>
              <p className="text-muted-foreground">{row.uhid} · {row.first_name} {row.last_name || ''} · Visit #{row.registration_id}</p>
            </div>
            <Button size="sm" onClick={() => router.push(`/patients/${row.patient_id}/case?tab=investigation`)}>Open Case</Button>
          </div>
        ))
      )}
    </Card>
  );

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Investigation Dashboard</h1>
          <p className="text-sm text-muted-foreground">Visit-linked lab workflow. Select a row to continue inside patient case dashboard.</p>
        </div>
        <Button variant="outline" onClick={() => router.push('/patients')}>Patients</Button>
      </div>
      <Input placeholder="Search by UHID, patient, test, status" value={search} onChange={(e) => setSearch(e.target.value)} />
      <div className="grid md:grid-cols-3 gap-4">
        {renderSection('Pending Tests', grouped.pending)}
        {renderSection('Sample Collected', grouped.sampleCollected)}
        {renderSection('Completed / Reports', grouped.completed)}
      </div>
    </main>
  );
}
