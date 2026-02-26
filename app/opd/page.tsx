'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function OpdDashboardPage() {
  const router = useRouter();
  const [rows, setRows] = useState<any[]>([]);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/opd-workflow?action=queue&visitDate=${today}`);
      if (res.ok) {
        const data = await res.json();
        setRows(data.rows || []);
      }
    })();
  }, [today]);

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">OPD Dashboard</h1>
      <Card className="p-4 text-sm">Queue list first (professional flow). Select visit to open centralized patient case.</Card>
      <div className="space-y-2">
        {rows.map((r) => (
          <Card key={r.id} className="p-3 flex items-center justify-between">
            <div>{r.uhid} · {r.first_name} {r.last_name} · Token {r.token_number || '-'}</div>
            <Button onClick={() => router.push(`/patients/${r.patient_id}/case?tab=opd`)}>Open Case</Button>
          </Card>
        ))}
      </div>
    </main>
  );
}
