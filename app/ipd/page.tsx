'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function IpdDashboardPage() {
  const router = useRouter();
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/visits?activeOnly=1&visitType=IPD');
      if (res.ok) {
        setRows(await res.json());
        return;
      }
      const all = await fetch('/api/registrations?type=IPD&status=Active');
      if (all.ok) setRows(await all.json());
    })();
  }, []);

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">IPD Dashboard</h1>
      <Card className="p-4 text-sm">Admitted patients list first. Use patient case for IPD admission conversion and care actions.</Card>
      <div className="space-y-2">
        {rows.map((r:any) => (
          <Card key={r.id} className="p-3 flex items-center justify-between">
            <div>{r.uhid} · {r.first_name} {r.last_name} · {r.room_type || '-'} / Bed {r.bed_number || '-'}</div>
            <Button onClick={() => router.push(`/patients/${r.patient_id}/case?tab=ipd`)}>Open Case</Button>
          </Card>
        ))}
      </div>
    </main>
  );
}
