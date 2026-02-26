'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface Registration {
  id: number;
  patient_id: number;
  status: string;
  registration_type: 'OPD' | 'IPD';
  admission_date: string;
  doctor_name?: string;
  dept_name?: string;
  first_name?: string;
  last_name?: string;
  uhid?: string;
  gender?: string;
  date_of_birth?: string;
  bill_status?: string;
  bill_amount_due?: number;
  pharmacy_clearance?: number;
  doctor_summary_complete?: number;
  token_number?: number;
  ward?: string;
  bed_number?: string;
  consultant_name?: string;
}


interface BillItem { id: number; category: string; name: string; quantity: number; amount: number; }
interface Bill { id: number; total_amount: number; amount_due: number; deposit_paid: number; status: string; }

const TABS = ['overview','opd','ipd','investigation','pharmacy','services','billing','payments','discharge','files'] as const;
type TabType = (typeof TABS)[number];

export default function PatientCaseDashboardPage() {
  const params = useParams<{ patientId: string }>();
  const patientId = Number(params.patientId);
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as TabType) || 'overview';

  const [tab, setTab] = useState<TabType>(TABS.includes(initialTab) ? initialTab : 'overview');
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [selectedRegistrationId, setSelectedRegistrationId] = useState<number | null>(null);
  const [bill, setBill] = useState<Bill | null>(null);
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [serviceName, setServiceName] = useState('');
  const [serviceRate, setServiceRate] = useState('0');
  const [paymentAmount, setPaymentAmount] = useState('0');
  const [doctorSummaryText, setDoctorSummaryText] = useState('');

  const selectedRegistration = useMemo(
    () => registrations.find((r) => r.id === selectedRegistrationId) || registrations[0],
    [registrations, selectedRegistrationId]
  );

  const age = useMemo(() => {
    if (!selectedRegistration?.date_of_birth) return '-';
    const dob = new Date(selectedRegistration.date_of_birth).getTime();
    return Math.max(0, Math.floor((Date.now() - dob) / (365.25 * 24 * 3600 * 1000)));
  }, [selectedRegistration?.date_of_birth]);

  const load = async () => {
    setLoading(true);
    const regRes = await fetch(`/api/registrations?patientId=${patientId}&limit=50`);
    const regData = regRes.ok ? await regRes.json() : [];
    setRegistrations(regData);
    const active = regData.find((r: Registration) => r.status === 'Active') || regData[0];
    setSelectedRegistrationId(active?.id || null);
    setLoading(false);
  };

  useEffect(() => { load(); }, [patientId]);

  const loadBilling = async (registrationId: number) => {
    const billRes = await fetch(`/api/billing?registrationId=${registrationId}`);
    const list = billRes.ok ? await billRes.json() : [];
    const latest = Array.isArray(list) ? list[0] : null;
    if (!latest) {
      setBill(null);
      setBillItems([]);
      return;
    }
    const detailRes = await fetch(`/api/billing?billId=${latest.id}`);
    const detail = detailRes.ok ? await detailRes.json() : null;
    setBill(detail?.bill || latest);
    setBillItems(detail?.items || []);
  };

  useEffect(() => {
    if (selectedRegistration?.id) loadBilling(selectedRegistration.id);
  }, [selectedRegistration?.id]);

  const ensureBill = async () => {
    if (!selectedRegistration) return null;
    if (bill?.id) return bill.id;
    const res = await fetch('/api/billing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create-bill', registration_id: selectedRegistration.id }),
    });
    if (!res.ok) {
      const existing = await fetch(`/api/billing?registrationId=${selectedRegistration.id}`).then((r) => r.json());
      return existing?.[0]?.id || null;
    }
    const created = await res.json();
    await loadBilling(selectedRegistration.id);
    return created.id;
  };

  const addServiceItem = async (category: 'lab' | 'medicine' | 'other' = 'other', name = serviceName, rate = Number(serviceRate)) => {
    if (!selectedRegistration || !name) return;
    const billId = await ensureBill();
    if (!billId) return;
    await fetch('/api/billing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add-item', bill_id: billId, category, name, quantity: 1, rate }),
    });
    await loadBilling(selectedRegistration.id);
    setServiceName('');
    setServiceRate('0');
  };

  const addPayment = async () => {
    if (!selectedRegistration || !bill?.id) return;
    await fetch('/api/billing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add-payment', bill_id: bill.id, amount: Number(paymentAmount), payment_mode: 'Cash' }),
    });
    await loadBilling(selectedRegistration.id);
  };

  const updateDischargeChecklist = async (patch: { pharmacy_clearance?: boolean; doctor_summary_complete?: boolean }) => {
    if (!selectedRegistration) return;
    await fetch(`/api/registrations/${selectedRegistration.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update-clearance', ...patch }),
    });
    await load();
  };

  const finalizeDischarge = async () => {
    if (!selectedRegistration) return;
    await fetch(`/api/registrations/${selectedRegistration.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Discharged' }),
    });
    await load();
  };

  const hasActiveVisit = !!selectedRegistration;

  const visitType = selectedRegistration?.registration_type || null;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.push('/patients')} className="p-0"><ArrowLeft className="w-5 h-5" /></Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold">Patient Case Dashboard</h1>
              <p className="text-xs text-muted-foreground">One patient context for OPD/IPD, investigations, billing, payment and discharge.</p>
            </div>
          </div>

          {selectedRegistration ? (
            <Card className="mt-4 p-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 text-sm">
              <div><p className="text-muted-foreground">Patient</p><p className="font-semibold">{selectedRegistration.first_name} {selectedRegistration.last_name || ''}</p></div>
              <div><p className="text-muted-foreground">UHID</p><p className="font-mono">{selectedRegistration.uhid}</p></div>
              <div><p className="text-muted-foreground">Age/Gender</p><p>{age} / {selectedRegistration.gender || '-'}</p></div>
              <div>
                <p className="text-muted-foreground">Active Visit</p>
                <div className="flex items-center gap-2">
                  <p>{selectedRegistration.registration_type} #{selectedRegistration.id}</p>
                  <Badge className={selectedRegistration.registration_type === 'IPD' ? 'bg-red-600 hover:bg-red-600 text-white' : 'bg-blue-600 hover:bg-blue-600 text-white'}>
                    {selectedRegistration.registration_type}
                  </Badge>
                </div>
              </div>
              <div><p className="text-muted-foreground">Department</p><p>{selectedRegistration.dept_name || 'General'}</p></div>
              <div><p className="text-muted-foreground">Status</p><Badge variant={selectedRegistration.status === 'Active' ? 'default' : 'secondary'}>{selectedRegistration.status}</Badge></div>

              {visitType === 'OPD' ? (
                <>
                  <div><p className="text-muted-foreground">Doctor Name</p><p>{selectedRegistration.doctor_name || selectedRegistration.consultant_name || '-'}</p></div>
                  <div><p className="text-muted-foreground">Visit Date</p><p>{selectedRegistration.admission_date || '-'}</p></div>
                  <div><p className="text-muted-foreground">Token Number</p><p>{selectedRegistration.token_number || '-'}</p></div>
                </>
              ) : (
                <>
                  <div><p className="text-muted-foreground">Ward</p><p>{selectedRegistration.ward || '-'}</p></div>
                  <div><p className="text-muted-foreground">Bed Number</p><p>{selectedRegistration.bed_number || '-'}</p></div>
                  <div><p className="text-muted-foreground">Admission Date</p><p>{selectedRegistration.admission_date || '-'}</p></div>
                  <div><p className="text-muted-foreground">Consultant Doctor</p><p>{selectedRegistration.consultant_name || selectedRegistration.doctor_name || '-'}</p></div>
                </>
              )}
            </Card>
          ) : (
            <Card className="mt-4 p-4 text-sm text-muted-foreground">No visit/admission found for this patient yet. Create registration first.</Card>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {loading ? <Card className="p-6">Loading patient case...</Card> : (
          <Tabs value={tab} onValueChange={(v) => setTab(v as TabType)}>
            <TabsList className="flex w-full overflow-x-auto justify-start">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="opd">OPD Consultation</TabsTrigger>
              <TabsTrigger value="ipd">IPD Admission</TabsTrigger>
              <TabsTrigger value="investigation">Investigation</TabsTrigger>
              <TabsTrigger value="pharmacy">Pharmacy</TabsTrigger>
              <TabsTrigger value="services">Services & OT</TabsTrigger>
              <TabsTrigger value="billing">Central Billing</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="discharge">Discharge</TabsTrigger>
              <TabsTrigger value="files">Files / Reports</TabsTrigger>
            </TabsList>

            <TabsContent value="overview"><Card className="p-5">Select module tabs above. Patient is selected once and reused across all modules.</Card></TabsContent>

            <TabsContent value="opd"><Card className="p-5 flex justify-between items-center"><p>Continue OPD consultation in existing OPD workflow page.</p><Button onClick={() => selectedRegistration && router.push(`/opd-flow?registrationId=${selectedRegistration.id}`)} disabled={!selectedRegistration}>Open OPD Module</Button></Card></TabsContent>

            <TabsContent value="ipd"><Card className="p-5 flex justify-between items-center"><p>Manage admission details and bed workflow.</p><Button onClick={() => selectedRegistration && router.push(`/ipd-workflow?registrationId=${selectedRegistration.id}`)} disabled={!selectedRegistration}>Open IPD Module</Button></Card></TabsContent>

            <TabsContent value="investigation">
              {!hasActiveVisit ? <Card className="p-5"><AlertTriangle className="w-5 h-5 text-amber-500 mb-2" />No active visit/admission available.</Card> :
                <Card className="p-5 space-y-3">
                  <p className="font-semibold">Order test and auto-add charge to billing ledger</p>
                  <div className="flex gap-2">
                    <Input placeholder="Test name" value={serviceName} onChange={(e) => setServiceName(e.target.value)} />
                    <Input placeholder="Rate" type="number" value={serviceRate} onChange={(e) => setServiceRate(e.target.value)} />
                    <Button onClick={async () => {
                      if (!selectedRegistration) return;
                      await addServiceItem('lab', serviceName || 'Lab Test', Number(serviceRate || 0));
                    }}>Order Test</Button>
                  </div>
                </Card>
              }
            </TabsContent>

            <TabsContent value="pharmacy"><Card className="p-5 space-y-3"><p>Dispense medicines within same patient case.</p><div className="flex gap-2"><Input placeholder="Medicine name" value={serviceName} onChange={(e)=>setServiceName(e.target.value)} /><Input type="number" placeholder="Rate" value={serviceRate} onChange={(e)=>setServiceRate(e.target.value)} /><Button onClick={() => addServiceItem('medicine', serviceName || 'Medicine', Number(serviceRate || 0))} disabled={!selectedRegistration}>Add Medicine Charge</Button></div></Card></TabsContent>

            <TabsContent value="services">
              {!hasActiveVisit ? <Card className="p-5"><AlertTriangle className="w-5 h-5 text-amber-500 mb-2" />Services/OT require active OPD visit or IPD admission.</Card> :
                <Card className="p-5 space-y-3"><p>Add OT/Service charges directly into centralized billing items.</p><div className="flex gap-2"><Input placeholder="Procedure/Service" value={serviceName} onChange={(e) => setServiceName(e.target.value)} /><Input type="number" placeholder="Rate" value={serviceRate} onChange={(e) => setServiceRate(e.target.value)} /><Button onClick={() => addServiceItem('other', serviceName || 'Service', Number(serviceRate || 0))}>Add Service</Button></div></Card>
              }
            </TabsContent>

            <TabsContent value="billing">
              <Card className="p-5 space-y-3">
                <div className="flex items-center justify-between"><p className="font-semibold">Unified Ledger</p><div className="text-sm">Total: ₹{bill?.total_amount || 0} | Paid: ₹{bill?.deposit_paid || 0} | Due: ₹{bill?.amount_due || 0}</div></div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm"><thead><tr className="text-left border-b"><th className="py-2">Item</th><th>Department</th><th>Quantity</th><th>Amount</th><th>Status</th></tr></thead><tbody>{billItems.map((i)=><tr key={i.id} className="border-b"><td className="py-2">{i.name}</td><td>{i.category}</td><td>{i.quantity}</td><td>₹{i.amount}</td><td><Badge variant={(bill?.status||'')==='Paid'?'default':'secondary'}>{bill?.status || 'Unpaid'}</Badge></td></tr>)}</tbody></table>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="payments"><Card className="p-5 space-y-3"><p>Collect payment against centralized bill.</p><div className="flex gap-2"><Input type="number" value={paymentAmount} onChange={(e)=>setPaymentAmount(e.target.value)} /><Button onClick={addPayment} disabled={!bill?.id}>Collect Payment</Button></div></Card></TabsContent>

            <TabsContent value="discharge">
              <Card className="p-5 space-y-4">
                <p className="font-semibold">Discharge Clearance</p>
                <div className="grid md:grid-cols-3 gap-3 text-sm"><Card className="p-3">Admission: {selectedRegistration?.registration_type || '-'}</Card><Card className="p-3">Billing Due: ₹{bill?.amount_due || 0}</Card><Card className="p-3">Billing Status: {bill?.status || 'Unpaid'}</Card></div>
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" onClick={()=>updateDischargeChecklist({ pharmacy_clearance: !Boolean(selectedRegistration?.pharmacy_clearance) })}>Pharmacy Clearance: {selectedRegistration?.pharmacy_clearance ? 'Yes' : 'No'}</Button>
                  <Button variant="outline" onClick={()=>updateDischargeChecklist({ doctor_summary_complete: !Boolean(selectedRegistration?.doctor_summary_complete) })}>Doctor Summary Complete: {selectedRegistration?.doctor_summary_complete ? 'Yes' : 'No'}</Button>
                </div>
                <Input placeholder="Doctor summary notes" value={doctorSummaryText} onChange={(e)=>setDoctorSummaryText(e.target.value)} />
                <Button disabled={(bill?.amount_due || 0) > 0} onClick={finalizeDischarge}>Final Discharge</Button>
              </Card>
            </TabsContent>

            <TabsContent value="files"><Card className="p-5">Reports and printable documents from this patient case will be available here. Use Billing tab for invoice print and OPD/IPD modules for summaries.</Card></TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}
