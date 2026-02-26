'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, AlertTriangle, FileText, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface VisitRow {
  id: number;
  patient_id: number;
  status: string;
  registration_type: 'OPD' | 'IPD';
  admission_date: string;
  admission_time?: string;
  doctor_name?: string;
  consultant_name?: string;
  dept_name?: string;
  token_number?: number;
  room_type?: string;
  bed_number?: string;
  first_name?: string;
  last_name?: string;
  uhid?: string;
  gender?: string;
  date_of_birth?: string;
  bill_total_amount?: number;
  bill_deposit_paid?: number;
  bill_amount_due?: number;
  bill_status?: string;
  pharmacy_clearance?: number;
  doctor_summary_complete?: number;
}

interface FlowData {
  registration: VisitRow;
  consultation: any;
  prescriptions: any[];
  labOrders: any[];
  bill: any;
  billItems: any[];
  payments: any[];
}

interface PatientFile {
  id: number;
  file_type: string;
  file_name: string;
  file_url: string;
  created_at: string;
}

const TABS = ['overview', 'opd', 'ipd', 'investigation', 'pharmacy', 'services', 'billing', 'payments', 'discharge', 'files'] as const;
type TabType = (typeof TABS)[number];

export default function PatientCaseDashboardPage() {
  const params = useParams<{ patientId: string }>();
  const patientId = Number(params.patientId);
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as TabType) || 'overview';

  const [tab, setTab] = useState<TabType>(TABS.includes(initialTab) ? initialTab : 'overview');
  const [visits, setVisits] = useState<VisitRow[]>([]);
  const [selectedVisitId, setSelectedVisitId] = useState<number | null>(null);
  const [flow, setFlow] = useState<FlowData | null>(null);
  const [files, setFiles] = useState<PatientFile[]>([]);
  const [loading, setLoading] = useState(true);

  const [consultationForm, setConsultationForm] = useState({ symptoms: '', diagnosis: '', prescription_notes: '', advice: '', follow_up_date: '' });
  const [labForm, setLabForm] = useState({ test_name: '', amount: '0' });
  const [rxForm, setRxForm] = useState({ medicine_name: '', dosage: '', frequency: '', duration: '', instructions: '' });
  const [serviceForm, setServiceForm] = useState({ item_type: 'service', name: '', amount: '0' });
  const [paymentForm, setPaymentForm] = useState({ amount: '0', payment_mode: 'Cash', reference_number: '' });
  const [ipdForm, setIpdForm] = useState({ ward: '', bed_number: '', consultant_name: '', admission_date: new Date().toISOString().slice(0, 10) });
  const [opdVisitForm, setOpdVisitForm] = useState({ visit_date: new Date().toISOString().slice(0, 10), consultation_fee: '0' });
  const [fileForm, setFileForm] = useState({ fileType: 'other', fileName: '', fileUrl: '' });

  const selectedVisit = useMemo(() => visits.find((v) => v.id === selectedVisitId) || visits[0], [visits, selectedVisitId]);
  const age = useMemo(() => {
    if (!selectedVisit?.date_of_birth) return '-';
    const dob = new Date(selectedVisit.date_of_birth).getTime();
    return Math.max(0, Math.floor((Date.now() - dob) / (365.25 * 24 * 3600 * 1000)));
  }, [selectedVisit?.date_of_birth]);

  const loadVisits = async () => {
    const res = await fetch(`/api/visits?patientId=${patientId}`);
    const data = res.ok ? await res.json() : [];
    setVisits(data);
    const active = data.find((v: VisitRow) => v.status === 'Active') || data[0];
    setSelectedVisitId(active?.id || null);
  };

  const loadFlow = async (visitId: number) => {
    const res = await fetch(`/api/opd-workflow?action=get-flow&registrationId=${visitId}`);
    if (res.ok) {
      const data = await res.json();
      setFlow(data);
      if (data?.consultation) {
        setConsultationForm({
          symptoms: data.consultation.symptoms || '',
          diagnosis: data.consultation.diagnosis || '',
          prescription_notes: data.consultation.prescription_notes || '',
          advice: data.consultation.advice || '',
          follow_up_date: data.consultation.follow_up_date || '',
        });
      }
    } else {
      setFlow(null);
    }
  };

  const loadFiles = async (visitId: number) => {
    const res = await fetch(`/api/files?patientId=${patientId}&visitId=${visitId}`);
    const data = res.ok ? await res.json() : [];

    const autoFiles: PatientFile[] = (flow?.labOrders || [])
      .filter((o: any) => !!o.report_url)
      .map((o: any) => ({ id: -o.id, file_type: 'lab', file_name: `${o.test_name} Report`, file_url: o.report_url, created_at: o.updated_at || o.created_at || '' }));

    setFiles([...autoFiles, ...data]);
  };

  const refresh = async () => {
    setLoading(true);
    await loadVisits();
    setLoading(false);
  };

  useEffect(() => { refresh(); }, [patientId]);

  useEffect(() => {
    (async () => {
      if (!selectedVisit?.id) return;
      await loadFlow(selectedVisit.id);
      await loadFiles(selectedVisit.id);
    })();
  }, [selectedVisit?.id]);

  useEffect(() => {
    (async () => {
      if (!selectedVisit?.id) return;
      await loadFiles(selectedVisit.id);
    })();
  }, [flow?.labOrders?.length]);

  const postOpdAction = async (payload: any) => {
    if (!selectedVisit?.id) return null;
    const res = await fetch('/api/opd-workflow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ registration_id: selectedVisit.id, ...payload }),
    });
    if (!res.ok) throw new Error('Request failed');
    return res.json();
  };

  const saveConsultation = async () => {
    await postOpdAction({ action: 'save-consultation', ...consultationForm });
    await loadFlow(selectedVisit!.id);
    await loadVisits();
  };

  const addPrescription = async () => {
    await postOpdAction({ action: 'add-prescription', ...rxForm });
    setRxForm({ medicine_name: '', dosage: '', frequency: '', duration: '', instructions: '' });
    await loadFlow(selectedVisit!.id);
  };

  const addLabOrder = async () => {
    await postOpdAction({ action: 'add-lab-order', test_name: labForm.test_name });
    if (Number(labForm.amount || 0) > 0) {
      await postOpdAction({ action: 'add-billing-item', item_type: 'lab', name: labForm.test_name, amount: Number(labForm.amount) });
    }
    setLabForm({ test_name: '', amount: '0' });
    await loadFlow(selectedVisit!.id);
    await loadVisits();
  };

  const updateLabStatus = async (orderId: number, status: string) => {
    await fetch('/api/opd-workflow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update-lab-order-status', order_id: orderId, status }),
    });
    await loadFlow(selectedVisit!.id);
  };

  const addService = async () => {
    await postOpdAction({ action: 'add-billing-item', item_type: serviceForm.item_type, name: serviceForm.name, amount: Number(serviceForm.amount) });
    setServiceForm({ item_type: 'service', name: '', amount: '0' });
    await loadFlow(selectedVisit!.id);
    await loadVisits();
  };

  const addPayment = async () => {
    await postOpdAction({ action: 'collect-payment', amount: Number(paymentForm.amount), payment_mode: paymentForm.payment_mode, reference_number: paymentForm.reference_number });
    setPaymentForm({ amount: '0', payment_mode: 'Cash', reference_number: '' });
    await loadFlow(selectedVisit!.id);
    await loadVisits();
  };


  const createOpdVisit = async () => {
    const res = await fetch('/api/opd-workflow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create-opd-visit',
        patient_id: patientId,
        visit_date: opdVisitForm.visit_date,
        consultation_fee: Number(opdVisitForm.consultation_fee || 0),
      }),
    });
    if (!res.ok) throw new Error('Failed to create OPD visit');
    const visit = await res.json();
    await refresh();
    setSelectedVisitId(visit.id);
  };

  const admitToIpd = async () => {
    const res = await fetch('/api/visits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patient_id: patientId,
        registration_type: 'IPD',
        admission_date: ipdForm.admission_date,
        consultant_name: ipdForm.consultant_name,
        ward: ipdForm.ward,
        bed_number: ipdForm.bed_number,
      }),
    });
    if (!res.ok) throw new Error('Failed to admit');
    await refresh();
  };

  const toggleDischargeChecklist = async (patch: { pharmacy_clearance?: boolean; doctor_summary_complete?: boolean }) => {
    if (!selectedVisit?.id) return;
    await fetch(`/api/registrations/${selectedVisit.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update-clearance', ...patch }),
    });
    await refresh();
  };

  const finalizeDischarge = async () => {
    if (!selectedVisit?.id) return;
    await fetch(`/api/registrations/${selectedVisit.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Discharged' }),
    });
    await refresh();
  };

  const uploadFile = async () => {
    if (!selectedVisit?.id) return;
    await fetch('/api/files', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId,
        visitId: selectedVisit.id,
        fileType: fileForm.fileType,
        fileName: fileForm.fileName,
        fileUrl: fileForm.fileUrl,
      }),
    });
    setFileForm({ fileType: 'other', fileName: '', fileUrl: '' });
    await loadFiles(selectedVisit.id);
  };

  const pendingLab = (flow?.labOrders || []).filter((o) => !['Completed', 'Report Uploaded'].includes(String(o.status))).length;
  const pendingServices = (flow?.billItems || []).filter((i) => String(i.category) === 'other').length;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.push('/patients')} className="p-0"><ArrowLeft className="w-5 h-5" /></Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold">Patient Case Dashboard</h1>
              <p className="text-xs text-muted-foreground">Centralized patient visit context across OPD/IPD, lab, pharmacy, billing, payments and discharge.</p>
            </div>
            <select className="h-9 border border-input rounded px-2" value={selectedVisit?.id || ''} onChange={(e) => setSelectedVisitId(Number(e.target.value))}>
              {visits.map((v) => <option key={v.id} value={v.id}>{v.registration_type} #{v.id} - {v.admission_date}</option>)}
            </select>
          </div>

          {selectedVisit ? (
            <Card className="mt-4 p-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 text-sm">
              <div><p className="text-muted-foreground">Patient</p><p className="font-semibold">{selectedVisit.first_name} {selectedVisit.last_name || ''}</p></div>
              <div><p className="text-muted-foreground">UHID</p><p className="font-mono">{selectedVisit.uhid}</p></div>
              <div><p className="text-muted-foreground">Age/Gender</p><p>{age} / {selectedVisit.gender || '-'}</p></div>
              <div><p className="text-muted-foreground">Active Visit</p><div className="flex items-center gap-2"><p>{selectedVisit.registration_type} #{selectedVisit.id}</p><Badge className={selectedVisit.registration_type === 'IPD' ? 'bg-red-600 hover:bg-red-600 text-white' : 'bg-blue-600 hover:bg-blue-600 text-white'}>{selectedVisit.registration_type}</Badge></div></div>
              <div><p className="text-muted-foreground">Department</p><p>{selectedVisit.dept_name || 'General'}</p></div>
              <div><p className="text-muted-foreground">Status</p><Badge variant={selectedVisit.status === 'Active' ? 'default' : 'secondary'}>{selectedVisit.status}</Badge></div>
              {selectedVisit.registration_type === 'OPD' ? (
                <>
                  <div><p className="text-muted-foreground">Doctor Name</p><p>{selectedVisit.doctor_name || selectedVisit.consultant_name || '-'}</p></div>
                  <div><p className="text-muted-foreground">Visit Date</p><p>{selectedVisit.admission_date || '-'}</p></div>
                  <div><p className="text-muted-foreground">Token Number</p><p>{selectedVisit.token_number || '-'}</p></div>
                </>
              ) : (
                <>
                  <div><p className="text-muted-foreground">Ward</p><p>{selectedVisit.room_type || '-'}</p></div>
                  <div><p className="text-muted-foreground">Bed Number</p><p>{selectedVisit.bed_number || '-'}</p></div>
                  <div><p className="text-muted-foreground">Admission Date</p><p>{selectedVisit.admission_date || '-'}</p></div>
                  <div><p className="text-muted-foreground">Consultant Doctor</p><p>{selectedVisit.consultant_name || selectedVisit.doctor_name || '-'}</p></div>
                </>
              )}
            </Card>
          ) : <Card className="mt-4 p-4 text-sm">No visit/admission found.</Card>}
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

            <TabsContent value="overview">
              {!selectedVisit && (
                <Card className="p-4 mb-4 border-amber-300 bg-amber-50">
                  <p className="font-semibold text-amber-900">Active visit required for clinical actions</p>
                  <p className="text-sm text-amber-800 mb-3">Create OPD visit or direct IPD admission to enable consultation, lab, billing, pharmacy and services.</p>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Create OPD Visit</p>
                      <div className="flex gap-2">
                        <Input type="date" value={opdVisitForm.visit_date} onChange={(e) => setOpdVisitForm((p) => ({ ...p, visit_date: e.target.value }))} />
                        <Input type="number" placeholder="Fee" value={opdVisitForm.consultation_fee} onChange={(e) => setOpdVisitForm((p) => ({ ...p, consultation_fee: e.target.value }))} />
                        <Button onClick={createOpdVisit}>Create OPD</Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Direct IPD Admission</p>
                      <div className="flex gap-2">
                        <Input placeholder="Ward" value={ipdForm.ward} onChange={(e) => setIpdForm((p) => ({ ...p, ward: e.target.value }))} />
                        <Input placeholder="Bed" value={ipdForm.bed_number} onChange={(e) => setIpdForm((p) => ({ ...p, bed_number: e.target.value }))} />
                        <Button variant="outline" onClick={admitToIpd}>Admit IPD</Button>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4"><p className="text-xs text-muted-foreground">Latest Diagnosis</p><p className="font-semibold">{flow?.consultation?.diagnosis || '-'}</p></Card>
                <Card className="p-4"><p className="text-xs text-muted-foreground">Billing</p><p>Total ₹{flow?.bill?.total_amount || 0} / Paid ₹{flow?.bill?.deposit_paid || 0} / Due ₹{flow?.bill?.amount_due || 0}</p></Card>
                <Card className="p-4"><p className="text-xs text-muted-foreground">Pending Lab Tests</p><p className="font-semibold">{pendingLab}</p></Card>
                <Card className="p-4"><p className="text-xs text-muted-foreground">Pending Services</p><p className="font-semibold">{pendingServices}</p></Card>
              </div>
              <Card className="p-4 mt-4">
                <p className="font-semibold mb-2">Visit Timeline</p>
                <div className="space-y-2 text-sm">{visits.map((v) => <div key={v.id} className="border rounded p-2 flex justify-between"><span>{v.registration_type} #{v.id} · {v.admission_date}</span><span>{v.status}</span></div>)}</div>
              </Card>
            </TabsContent>

            <TabsContent value="opd">
              <Card className="p-5 space-y-3">
                <p className="font-semibold">Consultation (linked to visitId #{selectedVisit?.id})</p>
                <div className="grid md:grid-cols-2 gap-2">
                  <Input placeholder="Symptoms" value={consultationForm.symptoms} onChange={(e) => setConsultationForm((p) => ({ ...p, symptoms: e.target.value }))} />
                  <Input placeholder="Diagnosis" value={consultationForm.diagnosis} onChange={(e) => setConsultationForm((p) => ({ ...p, diagnosis: e.target.value }))} />
                  <Input placeholder="Prescription notes" value={consultationForm.prescription_notes} onChange={(e) => setConsultationForm((p) => ({ ...p, prescription_notes: e.target.value }))} />
                  <Input placeholder="Advice" value={consultationForm.advice} onChange={(e) => setConsultationForm((p) => ({ ...p, advice: e.target.value }))} />
                  <Input type="date" value={consultationForm.follow_up_date} onChange={(e) => setConsultationForm((p) => ({ ...p, follow_up_date: e.target.value }))} />
                </div>
                <Button onClick={saveConsultation} disabled={!selectedVisit}>Save Consultation</Button>
                <Card className="p-3"><p className="text-xs text-muted-foreground">Current consultation summary</p><p>{flow?.consultation?.diagnosis || 'No consultation saved yet.'}</p></Card>
              </Card>
            </TabsContent>

            <TabsContent value="ipd">
              <Card className="p-5 space-y-3">
                <p className="font-semibold">Admit / Convert to IPD</p>
                <div className="grid md:grid-cols-4 gap-2">
                  <Input placeholder="Ward" value={ipdForm.ward} onChange={(e) => setIpdForm((p) => ({ ...p, ward: e.target.value }))} />
                  <Input placeholder="Bed Number" value={ipdForm.bed_number} onChange={(e) => setIpdForm((p) => ({ ...p, bed_number: e.target.value }))} />
                  <Input placeholder="Consultant Doctor" value={ipdForm.consultant_name} onChange={(e) => setIpdForm((p) => ({ ...p, consultant_name: e.target.value }))} />
                  <Input type="date" value={ipdForm.admission_date} onChange={(e) => setIpdForm((p) => ({ ...p, admission_date: e.target.value }))} />
                </div>
                <Button onClick={admitToIpd}>Admit to IPD</Button>
                <Card className="p-3"><p className="text-xs text-muted-foreground">Current IPD status</p><p>{selectedVisit?.registration_type === 'IPD' ? `Admitted in ${selectedVisit.room_type || '-'} / Bed ${selectedVisit.bed_number || '-'}` : 'Not admitted to IPD for selected visit.'}</p></Card>
              </Card>
            </TabsContent>

            <TabsContent value="investigation">
              <Card className="p-5 space-y-3">
                <p className="font-semibold">Lab Orders</p>
                <div className="flex gap-2">
                  <Input placeholder="Test name" value={labForm.test_name} onChange={(e) => setLabForm((p) => ({ ...p, test_name: e.target.value }))} />
                  <Input type="number" placeholder="Charge" value={labForm.amount} onChange={(e) => setLabForm((p) => ({ ...p, amount: e.target.value }))} />
                  <Button onClick={addLabOrder} disabled={!selectedVisit}>Create Lab Order</Button>
                </div>
                <div className="space-y-2">{(flow?.labOrders || []).map((o) => (
                  <div key={o.id} className="border rounded p-3 flex flex-wrap gap-2 items-center justify-between">
                    <span>{o.test_name}</span>
                    <span className="text-sm text-muted-foreground">{o.status}</span>
                    <div className="flex gap-1">
                      {['Ordered', 'Sample Collected', 'Completed', 'Report Uploaded'].map((st) => (
                        <Button key={st} size="sm" variant="outline" onClick={() => updateLabStatus(o.id, st)}>{st}</Button>
                      ))}
                    </div>
                  </div>
                ))}</div>
              </Card>
            </TabsContent>

            <TabsContent value="pharmacy">
              <Card className="p-5 space-y-3">
                <p className="font-semibold">Prescriptions & Dispensing</p>
                <div className="grid md:grid-cols-5 gap-2">
                  <Input placeholder="Medicine" value={rxForm.medicine_name} onChange={(e) => setRxForm((p) => ({ ...p, medicine_name: e.target.value }))} />
                  <Input placeholder="Dosage" value={rxForm.dosage} onChange={(e) => setRxForm((p) => ({ ...p, dosage: e.target.value }))} />
                  <Input placeholder="Frequency" value={rxForm.frequency} onChange={(e) => setRxForm((p) => ({ ...p, frequency: e.target.value }))} />
                  <Input placeholder="Duration" value={rxForm.duration} onChange={(e) => setRxForm((p) => ({ ...p, duration: e.target.value }))} />
                  <Button onClick={addPrescription} disabled={!selectedVisit}>Add Prescription</Button>
                </div>
                <div className="space-y-2">{(flow?.prescriptions || []).map((p: any) => (
                  <div key={p.id} className="border rounded p-2 flex items-center justify-between">
                    <span>{p.medicine_name} · {p.dosage || '-'} · {p.frequency || '-'}</span>
                    <Button size="sm" onClick={async () => {
                      await postOpdAction({ action: 'add-billing-item', item_type: 'medicine', name: p.medicine_name, amount: 100 });
                      await loadFlow(selectedVisit!.id);
                    }}>Dispense + Bill</Button>
                  </div>
                ))}</div>
              </Card>
            </TabsContent>

            <TabsContent value="services">
              <Card className="p-5 space-y-3">
                <p className="font-semibold">Services & OT Charges</p>
                <div className="grid md:grid-cols-4 gap-2">
                  <select className="h-10 border rounded px-2" value={serviceForm.item_type} onChange={(e) => setServiceForm((p) => ({ ...p, item_type: e.target.value }))}>
                    <option value="service">Service</option>
                    <option value="consultation">Consultation</option>
                    <option value="lab">Lab</option>
                    <option value="medicine">Medicine</option>
                  </select>
                  <Input placeholder="Item name" value={serviceForm.name} onChange={(e) => setServiceForm((p) => ({ ...p, name: e.target.value }))} />
                  <Input type="number" placeholder="Amount" value={serviceForm.amount} onChange={(e) => setServiceForm((p) => ({ ...p, amount: e.target.value }))} />
                  <Button onClick={addService} disabled={!selectedVisit}>Add Charge</Button>
                </div>
                <div className="space-y-2">{(flow?.billItems || []).filter((i) => ['other', 'doctor'].includes(i.category)).map((i) => (
                  <div key={i.id} className="border rounded p-2 flex justify-between"><span>{i.name}</span><span>₹{i.amount}</span></div>
                ))}</div>
              </Card>
            </TabsContent>

            <TabsContent value="billing">
              <Card className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">Central Billing Ledger</p>
                  <p className="text-sm">Total ₹{flow?.bill?.total_amount || 0} · Paid ₹{flow?.bill?.deposit_paid || 0} · Due ₹{flow?.bill?.amount_due || 0}</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm"><thead><tr className="text-left border-b"><th className="py-2">Item</th><th>Department</th><th>Qty</th><th>Amount</th><th>Status</th></tr></thead><tbody>
                    {(flow?.billItems || []).map((i) => <tr key={i.id} className="border-b"><td className="py-2">{i.name}</td><td>{i.category}</td><td>{i.quantity}</td><td>₹{i.amount}</td><td>{flow?.bill?.status || 'Unpaid'}</td></tr>)}
                  </tbody></table>
                </div>
                <Button variant="outline" onClick={() => window.print()}>Print Bill</Button>
              </Card>
            </TabsContent>

            <TabsContent value="payments">
              <Card className="p-5 space-y-3">
                <p className="font-semibold">Payment Collection</p>
                <div className="grid md:grid-cols-4 gap-2">
                  <Input type="number" placeholder="Amount" value={paymentForm.amount} onChange={(e) => setPaymentForm((p) => ({ ...p, amount: e.target.value }))} />
                  <select className="h-10 border rounded px-2" value={paymentForm.payment_mode} onChange={(e) => setPaymentForm((p) => ({ ...p, payment_mode: e.target.value }))}>
                    <option>Cash</option><option>UPI</option><option>Card</option><option>Online</option>
                  </select>
                  <Input placeholder="Reference" value={paymentForm.reference_number} onChange={(e) => setPaymentForm((p) => ({ ...p, reference_number: e.target.value }))} />
                  <Button onClick={addPayment} disabled={!selectedVisit}>Record Payment</Button>
                </div>
                <div className="space-y-2">{(flow?.payments || []).map((p: any) => (
                  <div key={p.id} className="border rounded p-2 flex justify-between"><span>{p.payment_date} · {p.payment_mode}</span><span>₹{p.amount}</span></div>
                ))}</div>
              </Card>
            </TabsContent>

            <TabsContent value="discharge">
              <Card className="p-5 space-y-4">
                <p className="font-semibold">Discharge Checklist</p>
                <div className="grid md:grid-cols-3 gap-3 text-sm">
                  <Card className="p-3">Doctor Summary: {selectedVisit?.doctor_summary_complete ? 'Completed' : 'Pending'}</Card>
                  <Card className="p-3">Pharmacy Clearance: {selectedVisit?.pharmacy_clearance ? 'Done' : 'Pending'}</Card>
                  <Card className="p-3">Billing Due: ₹{flow?.bill?.amount_due || 0}</Card>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" onClick={() => toggleDischargeChecklist({ doctor_summary_complete: !Boolean(selectedVisit?.doctor_summary_complete) })}>Toggle Doctor Summary</Button>
                  <Button variant="outline" onClick={() => toggleDischargeChecklist({ pharmacy_clearance: !Boolean(selectedVisit?.pharmacy_clearance) })}>Toggle Pharmacy Clearance</Button>
                </div>
                <Button disabled={(flow?.bill?.amount_due || 0) > 0} onClick={finalizeDischarge}>Finalize Discharge</Button>
              </Card>
            </TabsContent>

            <TabsContent value="files">
              <Card className="p-5 space-y-3">
                <p className="font-semibold">Files / Reports (patient + visit linked)</p>
                <div className="grid md:grid-cols-4 gap-2">
                  <select className="h-10 border rounded px-2" value={fileForm.fileType} onChange={(e) => setFileForm((p) => ({ ...p, fileType: e.target.value }))}>
                    <option value="lab">lab</option><option value="prescription">prescription</option><option value="billing">billing</option><option value="discharge">discharge</option><option value="other">other</option>
                  </select>
                  <Input placeholder="File name" value={fileForm.fileName} onChange={(e) => setFileForm((p) => ({ ...p, fileName: e.target.value }))} />
                  <Input placeholder="File URL (PDF link)" value={fileForm.fileUrl} onChange={(e) => setFileForm((p) => ({ ...p, fileUrl: e.target.value }))} />
                  <Button onClick={uploadFile} disabled={!selectedVisit}><Upload className="w-4 h-4 mr-1" />Upload</Button>
                </div>
                <div className="space-y-2">{files.map((f) => (
                  <a key={`${f.id}-${f.file_url}`} href={f.file_url} target="_blank" rel="noreferrer" className="border rounded p-2 flex items-center justify-between hover:bg-muted/30">
                    <span className="flex items-center gap-2"><FileText className="w-4 h-4" />{f.file_name} <Badge variant="secondary">{f.file_type}</Badge></span>
                    <span className="text-xs text-muted-foreground">{f.created_at}</span>
                  </a>
                ))}</div>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {!selectedVisit && <Card className="mt-4 p-4"><AlertTriangle className="w-4 h-4 mb-2" />No active visit selected.</Card>}
      </main>
    </div>
  );
}
