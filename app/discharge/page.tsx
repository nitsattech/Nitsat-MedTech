'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface IpdRow {
  id: number;
  patient_id: number;
  uhid: string;
  first_name: string;
  last_name?: string;
  bill_amount_due?: number;
  pharmacy_clearance?: number;
  doctor_summary_complete?: number;
  admission_date: string;
}

export default function DischargeDashboardPage() {
  const router = useRouter();
  const [rows, setRows] = useState<IpdRow[]>([]);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/registrations?type=IPD&status=Active');
      if (!res.ok) return;
      setRows(await res.json());
    })();
  }, []);

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Discharge Dashboard</h1>
      <Card className="p-4 text-sm">Only active IPD visits are listed. Final discharge is processed inside patient case Discharge tab with billing and checklist validation.</Card>
      <div className="space-y-2">
        {rows.map((row) => {
          const due = Number(row.bill_amount_due || 0);
          const ready = due <= 0 && Boolean(row.pharmacy_clearance) && Boolean(row.doctor_summary_complete);
          return (
            <Card key={row.id} className="p-3 flex items-center justify-between">
              <div className="text-sm">
                <p className="font-medium">{row.uhid} · {row.first_name} {row.last_name || ''}</p>
                <p className="text-muted-foreground">IPD Visit #{row.id} · Admit {row.admission_date} · Due ₹{due} · {ready ? 'Ready to discharge' : 'Checklist pending'}</p>
              </div>
              <Button onClick={() => router.push(`/patients/${row.patient_id}/case?tab=discharge`)}>Open Case</Button>
            </Card>
          );
        })}
      </div>
    </main>
  );
}
