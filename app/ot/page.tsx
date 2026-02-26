'use client';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function OtDashboardPage() {
  const router = useRouter();
  return (
    <main className="max-w-5xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">OT Dashboard</h1>
      <Card className="p-4">OT procedures must be attached to active visitId. Use patient case → Services & OT tab.</Card>
      <Button onClick={() => router.push('/patients')}>Go to Patients</Button>
    </main>
  );
}
