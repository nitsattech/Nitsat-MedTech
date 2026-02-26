'use client';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function PaymentsDashboardPage() {
  const router = useRouter();
  return (
    <main className="max-w-5xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Payments Dashboard</h1>
      <Card className="p-4">Record payments visit-wise from centralized patient case dashboard (Payments tab).</Card>
      <Button onClick={() => router.push('/patients')}>Open Patient Case</Button>
    </main>
  );
}
