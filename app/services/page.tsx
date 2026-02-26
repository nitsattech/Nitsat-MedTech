'use client';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ServicesDashboardPage() {
  const router = useRouter();
  return (
    <main className="max-w-5xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Services Dashboard</h1>
      <Card className="p-4">Service and OT booking are visit-linked. Select patient then open Services & OT tab in case dashboard.</Card>
      <Button onClick={() => router.push('/patients')}>Go to Patients</Button>
    </main>
  );
}
