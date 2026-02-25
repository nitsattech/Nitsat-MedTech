'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Circle, Search, UserRound, Stethoscope, FlaskConical, Receipt, IndianRupee, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Patient {
  id: number;
  uhid: string;
  first_name: string;
  last_name?: string;
  phone?: string;
}

interface Registration {
  id: number;
  registration_type: string;
  status: string;
  admission_date: string;
  consultant_name?: string;
  provisional_diagnosis?: string;
  procedure_treatment?: string;
  bill_status?: string;
}

interface Bill {
  id: number;
  status: string;
  amount_due: number;
  total_amount: number;
}

interface StepState {
  key: string;
  label: string;
  done: boolean;
  hint: string;
}

export default function IPDWorkflowPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [loadingFlow, setLoadingFlow] = useState(false);
  const [error, setError] = useState('');

  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [bill, setBill] = useState<Bill | null>(null);
  const [serviceCount, setServiceCount] = useState(0);

  const loadPatientFlow = async (patient: Patient) => {
    setSelectedPatient(patient);
    setLoadingFlow(true);
    setError('');
    setRegistration(null);
    setBill(null);
    setServiceCount(0);

    try {
      const regsRes = await fetch(`/api/registrations?patientId=${patient.id}&type=IPD&limit=50`);
      if (!regsRes.ok) throw new Error('Unable to load registrations');
      const regs: Registration[] = await regsRes.json();
      const latest = regs.find((r) => r.status === 'Active') || regs[0];

      if (!latest) {
        setLoadingFlow(false);
        return;
      }

      setRegistration(latest);

      const billRes = await fetch(`/api/billing?registrationId=${latest.id}`);
      if (billRes.ok) {
        const bills: Bill[] = await billRes.json();
        const latestBill = bills?.[0];
        if (latestBill) {
          setBill(latestBill);
          const fullRes = await fetch(`/api/billing?billId=${latestBill.id}`);
          if (fullRes.ok) {
            const detail = await fullRes.json();
            setServiceCount(Array.isArray(detail.items) ? detail.items.length : 0);
          }
        }
      }
    } catch {
      setError('Unable to load full IPD workflow right now.');
    } finally {
      setLoadingFlow(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;
    setSearching(true);
    setError('');
    try {
      const res = await fetch(`/api/patients?search=${encodeURIComponent(search.trim())}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPatients(Array.isArray(data) ? data : []);
    } catch {
      setError('Patient search failed.');
    } finally {
      setSearching(false);
    }
  };

  const steps: StepState[] = useMemo(() => {
    const consultationDone = Boolean(
      registration?.consultant_name || registration?.provisional_diagnosis || registration?.procedure_treatment
    );

    return [
      {
        key: 'patient',
        label: 'Patient',
        done: Boolean(selectedPatient),
        hint: selectedPatient ? `${selectedPatient.first_name} ${selectedPatient.last_name || ''}` : 'Patient not selected',
      },
      {
        key: 'visit',
        label: 'Visit (IPD Admission)',
        done: Boolean(registration),
        hint: registration ? `Reg #${registration.id} • ${registration.admission_date}` : 'No IPD visit found',
      },
      {
        key: 'consultation',
        label: 'Consultation',
        done: consultationDone,
        hint: consultationDone ? `Consultant: ${registration?.consultant_name || 'Updated'}` : 'Consultation summary pending',
      },
      {
        key: 'services',
        label: 'Services Added (Lab / Medicine)',
        done: serviceCount > 0,
        hint: serviceCount > 0 ? `${serviceCount} service item(s) added` : 'No service item in billing yet',
      },
      {
        key: 'ledger',
        label: 'Billing Ledger',
        done: Boolean(bill),
        hint: bill ? `Bill #${bill.id} • ₹${Number(bill.total_amount || 0).toFixed(2)}` : 'Billing ledger not created',
      },
      {
        key: 'payment',
        label: 'Payment',
        done: Boolean(bill && bill.status === 'Paid' && Number(bill.amount_due || 0) <= 0),
        hint: bill
          ? `Status: ${bill.status} • Due ₹${Number(bill.amount_due || 0).toFixed(2)}`
          : 'Payment not started',
      },
      {
        key: 'discharge',
        label: 'Discharge',
        done: Boolean(registration?.status === 'Discharged'),
        hint:
          registration?.status === 'Discharged'
            ? 'Discharged'
            : 'Use Discharge module after checklist + full payment',
      },
    ];
  }, [selectedPatient, registration, bill, serviceCount]);

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')} className="p-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-bold text-slate-800">IPD Professional Workflow</h1>
            <p className="text-xs text-slate-500">Patient → Visit → Consultation → Services → Billing → Payment → Discharge</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 space-y-4">
        <Card className="p-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search patient by UHID / name / mobile" />
            <Button type="submit" disabled={searching}>
              <Search className="w-4 h-4 mr-1" />{searching ? 'Searching...' : 'Search'}
            </Button>
          </form>
        </Card>

        {error && (
          <Alert className="bg-destructive/10 border-destructive/20">
            <AlertDescription className="text-destructive text-sm">{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="p-4 lg:col-span-1">
            <h2 className="font-semibold mb-3">Patients</h2>
            <div className="space-y-2 max-h-[520px] overflow-auto">
              {patients.length === 0 ? (
                <p className="text-sm text-slate-400">Search to load patients.</p>
              ) : (
                patients.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => loadPatientFlow(p)}
                    className={`w-full text-left p-3 rounded border transition ${selectedPatient?.id === p.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'}`}
                  >
                    <p className="font-semibold text-sm">{p.first_name} {p.last_name || ''}</p>
                    <p className="text-xs text-slate-500">UHID: {p.uhid}</p>
                    <p className="text-xs text-slate-500">{p.phone || '-'}</p>
                  </button>
                ))
              )}
            </div>
          </Card>

          <Card className="p-4 lg:col-span-2">
            <h2 className="font-semibold mb-1">IPD Flow Status</h2>
            <p className="text-xs text-slate-500 mb-4">Each stage must be completed in order for professional hospital operations.</p>

            {loadingFlow ? (
              <p className="text-sm text-slate-500">Loading workflow...</p>
            ) : (
              <div className="space-y-3">
                {steps.map((step, index) => (
                  <div key={step.key} className="border rounded-lg p-3 bg-white flex items-start gap-3">
                    <div className="mt-0.5">
                      {step.done ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <Circle className="w-5 h-5 text-slate-300" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-800">{index + 1}. {step.label}</p>
                      <p className={`text-xs ${step.done ? 'text-green-600' : 'text-slate-500'}`}>{step.hint}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-2">
              <Button variant="outline" onClick={() => router.push('/patient-registration')}><UserRound className="w-4 h-4 mr-1" />Patient/Visit</Button>
              <Button variant="outline" onClick={() => router.push('/patient-registration')}><Stethoscope className="w-4 h-4 mr-1" />Consultation</Button>
              <Button variant="outline" onClick={() => router.push('/billing')}><FlaskConical className="w-4 h-4 mr-1" />Services</Button>
              <Button variant="outline" onClick={() => router.push('/billing')}><Receipt className="w-4 h-4 mr-1" />Ledger</Button>
              <Button variant="outline" onClick={() => router.push('/billing')}><IndianRupee className="w-4 h-4 mr-1" />Payment</Button>
              <Button onClick={() => router.push('/discharge')}><LogOut className="w-4 h-4 mr-1" />Discharge</Button>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
