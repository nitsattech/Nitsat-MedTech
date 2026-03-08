'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  FlaskConical,
  Search,
  Plus,
  Users,
  FileText,
  Activity
} from 'lucide-react';

interface LabOrder {
  id: number;
  test_name: string;
  status: string;
  patient_name: string;
  uhid: string;
  registration_id: number;
}

interface Test {
  id: number;
  name: string;
  rate: number;
}

const getUserRole = () => {
  if (typeof document === 'undefined') return null;
  const cookie = document.cookie
    .split('; ')
    .find((row) => row.startsWith('userRole='));
  return cookie ? cookie.split('=')[1] : null;
};

export default function InvestigationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registrationId = searchParams.get('registrationId');

  const [role, setRole] = useState<string | null>(null);
  const [labQueue, setLabQueue] = useState<LabOrder[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [selectedTest, setSelectedTest] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const r = getUserRole();
    setRole(r);

    // Role protection (lab + admin only)
    if (r !== 'lab_technician' && r !== 'admin') {
      router.push('/dashboard');
    }
  }, []);

  // Fetch Lab Dashboard Queue (NO registrationId case)
  useEffect(() => {
    if (registrationId) return;

    const fetchQueue = async () => {
      try {
        const res = await fetch('/api/investigations'); // lab dashboard API
        const data = await res.json();
        setLabQueue(data.queue || []);
      } catch (err) {
        console.error('Lab queue error', err);
      }
    };

    fetchQueue();
  }, [registrationId]);


  // If NO patient selected → Show Lab Dashboard (Professional)
  if (!registrationId) {
    return (
      <div className="min-h-screen bg-slate-100 p-6 space-y-6">
        {/* Header */}
        <Card className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FlaskConical className="w-7 h-7 text-teal-600" />
            <div>
              <h1 className="text-2xl font-bold">Pathology / Lab Dashboard</h1>
              <p className="text-sm text-slate-500">
                Manage all laboratory investigations & pending orders
              </p>

            </div>
          </div>

          <Button onClick={() => router.push('/dashboard')}>
            Back to Dashboard
          </Button>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4">
            <p className="text-sm text-slate-500">Pending Tests</p>
            <p className="text-2xl font-bold text-yellow-600">
              {labQueue.filter(q => q.status === 'Pending').length}
            </p>
          </Card>

          <Card className="p-4">
            <p className="text-sm text-slate-500">Completed Tests</p>
            <p className="text-2xl font-bold text-green-600">
              {labQueue.filter(q => q.status === 'Completed').length}
            </p>
          </Card>

          <Card className="p-4">
            <p className="text-sm text-slate-500">Total Orders</p>
            <p className="text-2xl font-bold text-blue-600">
              {labQueue.length}
            </p>
          </Card>
        </div>

        {/* Lab Orders Table */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Today’s Lab Orders
          </h2>

          {labQueue.length === 0 ? (
            <p className="text-slate-400 text-center py-10">
              No lab orders yet. Orders will appear here when doctor sends tests.
            </p>
          ) : (
            <table className="w-full border rounded-lg">
              <thead className="bg-slate-200">
                <tr>
                  <th className="p-3 text-left">UHID</th>
                  <th className="p-3 text-left">Patient</th>
                  <th className="p-3 text-left">Test</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {labQueue.map((order) => (
                  <tr key={order.id} className="border-t">
                    <td className="p-3">{order.uhid}</td>
                    <td className="p-3">{order.patient_name}</td>
                    <td className="p-3 font-medium">{order.test_name}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs ${
                        order.status === 'Pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <Button
                        size="sm"
                        onClick={() =>
                          router.push(
                            `/investigations?registrationId=${order.registration_id}`
                          )
                        }
                      >
                        Open
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    );
  }

  // Patient Specific Investigation Page (Doctor/Lab)
  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <Card className="p-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Activity className="w-6 h-6 text-teal-600" />
          Patient Laboratory Investigations
        </h1>
        <p className="text-slate-500 mt-1">
          Registration ID: {registrationId}
        </p>
      </Card>

      <Card className="p-6 mt-4">
        <h2 className="font-semibold mb-4">Order New Lab Test</h2>

        <p className="text-slate-400 py-6">
          Investigation ordering UI is under construction. You can navigate back to dashboard or proceed to billing.
        </p>

        <div className="mt-6 flex gap-4 justify-end">
          <Button variant="outline" onClick={() => router.push('/dashboard')}>
            Back
          </Button>
          <Button
            className="bg-primary hover:bg-primary/90"
            onClick={() => router.push(`/billing?registrationId=${registrationId}`)}
          >
            Proceed to Billing
          </Button>
        </div>
      </Card>
    </div>
  );
}