'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Search,
  UserPlus,
  Receipt,
  Wallet,
  Stethoscope,
  FlaskConical,
  Pill,
  FileText,
  Users,
  BadgeIndianRupee,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Patient { id: number; uhid: string; first_name: string; last_name?: string; phone?: string; }
interface Registration { id: number; token_number?: number; opd_visit_status?: string; status: string; admission_date: string; }
interface Consultation { symptoms?: string; diagnosis?: string; prescription_notes?: string; advice?: string; follow_up_date?: string; }
interface LabOrder { id: number; test_name: string; status: string; registration_id: number; uhid?: string; first_name?: string; last_name?: string; token_number?: number; }

interface BillItem { id: number; category: string; name: string; amount: number; }
interface Bill { id: number; total_amount: number; deposit_paid: number; amount_due: number; status: string; }
interface Doctor { id: number; name: string; specialization?: string; }
interface Department { id: number; name: string; }
interface QueueRow { id: number; token_number?: number; opd_visit_status?: string; first_name: string; last_name?: string; uhid: string; }

export default function OPDFlowPage() {
  const router = useRouter();


  const [search, setSearch] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [consultation, setConsultation] = useState<Consultation>({});
  const [labOrders, setLabOrders] = useState<LabOrder[]>([]);
  const [labDashboardOrders, setLabDashboardOrders] = useState<LabOrder[]>([]);
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [bill, setBill] = useState<Bill | null>(null);


  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [queueDate, setQueueDate] = useState(new Date().toISOString().slice(0, 10));
  const [queue, setQueue] = useState<{ waiting: QueueRow[]; in_consultation: QueueRow[]; completed: QueueRow[] }>({ waiting: [], in_consultation: [], completed: [] });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [newPatient, setNewPatient] = useState({ first_name: '', last_name: '', phone: '', gender: 'Male' });
  const [autoVisitOnCreate, setAutoVisitOnCreate] = useState(true);

  const [visitForm, setVisitForm] = useState({ doctor_id: '', department_id: '', visit_date: new Date().toISOString().slice(0, 10), consultation_fee: '300' });
  const [consultForm, setConsultForm] = useState({ symptoms: '', diagnosis: '', prescription_notes: '', advice: '', follow_up_date: '' });
  const [serviceForm, setServiceForm] = useState({ item_type: 'consultation', name: '', quantity: '1', amount: '' });
  const [labForm, setLabForm] = useState({ test_name: '' });
  const [paymentForm, setPaymentForm] = useState({ amount: '', payment_mode: 'Cash', reference_number: '' });

  const callApi = async (method: 'GET' | 'POST', action: string, payload?: Record<string, any>) => {
    if (method === 'GET') {
      const params = new URLSearchParams({ action, ...(payload || {}) });
      const res = await fetch(`/api/opd-workflow?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      return data;
    }

    const res = await fetch('/api/opd-workflow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...(payload || {}) }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  };

  const refreshFlow = async (registrationId: number) => {
    const data = await callApi('GET', 'get-flow', { registrationId: String(registrationId) });
    setRegistration(data.registration);
    setConsultation(data.consultation || {});
    setLabOrders(data.labOrders || []);
    setBillItems(data.billItems || []);
    setBill(data.bill || null);
  };


  const loadQueue = async (visitDate?: string) => {
    try {
      const date = visitDate || queueDate;
      const data = await callApi('GET', 'queue', { visitDate: date });
      setQueue(data.grouped || { waiting: [], in_consultation: [], completed: [] });
    } catch {
      // optional board
    }
  };

  const loadLabDashboard = async (visitDate?: string) => {
    try {
      const date = visitDate || queueDate;
      const data = await callApi('GET', 'lab-dashboard', { visitDate: date });
      setLabDashboardOrders(Array.isArray(data) ? data : []);
    } catch {
      // optional board

    }
  };

  const loadMeta = async () => {
    try {
      const [docRes, deptRes] = await Promise.all([fetch('/api/doctors'), fetch('/api/departments')]);
      if (docRes.ok) {
        const docs = await docRes.json();
        setDoctors(Array.isArray(docs) ? docs : []);
      }
      if (deptRes.ok) {
        const depts = await deptRes.json();
        setDepartments(Array.isArray(depts) ? depts : []);
      }
    } catch {
      // non-blocking
    }

  };

  useEffect(() => {
    loadMeta();
    loadQueue(queueDate);
    loadLabDashboard(queueDate);

  }, []);

  const handleSearchPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;
    setLoading(true);
    setError('');

    try {
      const data = await callApi('GET', 'search-patients', { search: search.trim() });
      setPatients(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }

  };

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const patient = await callApi('POST', 'create-patient', newPatient);
      setPatients((prev) => [patient, ...prev]);
      setSelectedPatient(patient);

      if (autoVisitOnCreate) {
        const visit = await callApi('POST', 'create-opd-visit', {
          patient_id: patient.id,
          doctor_id: visitForm.doctor_id ? Number(visitForm.doctor_id) : undefined,
          department_id: visitForm.department_id ? Number(visitForm.department_id) : undefined,
          visit_date: visitForm.visit_date,
          consultation_fee: Number(visitForm.consultation_fee || 0),
        });
        await refreshFlow(visit.id);
        await loadQueue(visitForm.visit_date);
        setSuccess(`Patient created and OPD visit token #${visit.token_number || '-'} generated.`);
      } else {
        setSuccess('Patient profile created. Please create visit from Visit section.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }

  };

  const handleCreateVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    setLoading(true);
    setError('');

    try {
      const visit = await callApi('POST', 'create-opd-visit', {
        patient_id: selectedPatient.id,
        doctor_id: visitForm.doctor_id ? Number(visitForm.doctor_id) : undefined,
        department_id: visitForm.department_id ? Number(visitForm.department_id) : undefined,
        visit_date: visitForm.visit_date,
        consultation_fee: Number(visitForm.consultation_fee || 0),
      });
      await refreshFlow(visit.id);
      await loadQueue(visitForm.visit_date);
      setSuccess(`OPD visit created with token #${visit.token_number || '-'}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateVisitStatus = async (status: 'Waiting' | 'In Consultation' | 'Completed') => {
    if (!registration) return;
    setLoading(true);
    setError('');
    try {
      await callApi('POST', 'update-visit-status', { registration_id: registration.id, opd_visit_status: status });
      await refreshFlow(registration.id);
      await loadQueue();
      setSuccess(`Visit moved to ${status}.`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }

  };

  const handleSaveConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registration) return;
    setLoading(true);
    setError('');
    try {
      await callApi('POST', 'save-consultation', { registration_id: registration.id, ...consultForm });
      await refreshFlow(registration.id);
      await updateVisitStatus('In Consultation');
      setSuccess('Consultation saved.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }

  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registration) return;
    setLoading(true);
    setError('');

    try {
      await callApi('POST', 'add-billing-item', {
        registration_id: registration.id,
        item_type: serviceForm.item_type,
        name: serviceForm.name,
        quantity: Number(serviceForm.quantity || 1),
        amount: Number(serviceForm.amount || 0),
      });
      if (serviceForm.item_type === 'medicine') {
        await callApi('POST', 'add-prescription', {
          registration_id: registration.id,
          medicine_name: serviceForm.name,
          dosage: 'As advised',
        });
      }
      setServiceForm({ item_type: 'consultation', name: '', quantity: '1', amount: '' });
      await refreshFlow(registration.id);
      setSuccess('Service added to billing ledger.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }

  };

  const handleAddLabOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registration) return;
    setLoading(true);
    setError('');

    try {
      await callApi('POST', 'add-lab-order', { registration_id: registration.id, test_name: labForm.test_name });
      setLabForm({ test_name: '' });
      await refreshFlow(registration.id);
      await loadLabDashboard(visitForm.visit_date);
      setSuccess('Lab order sent to Lab Department successfully.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }

  };

  const handleUpdateLabStatus = async (orderId: number, status: string) => {
    if (!registration) return;
    setLoading(true);
    setError('');
    try {
      await callApi('POST', 'update-lab-order-status', { order_id: orderId, status });
      await refreshFlow(registration.id);
      await loadLabDashboard(visitForm.visit_date);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }

  };

  const handleCollectPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registration) return;
    setLoading(true);
    setError('');

    try {
      await callApi('POST', 'collect-payment', {
        registration_id: registration.id,
        amount: Number(paymentForm.amount || 0),
        payment_mode: paymentForm.payment_mode,
        reference_number: paymentForm.reference_number,
      });
      setPaymentForm({ amount: '', payment_mode: 'Cash', reference_number: '' });
      await refreshFlow(registration.id);
      setSuccess('Payment collected successfully.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }

  };

  const handleCompleteVisit = async () => {
    if (!registration) return;
    setLoading(true);
    setError('');
    try {
      await callApi('POST', 'complete-visit', { registration_id: registration.id });
      await refreshFlow(registration.id);
      await loadQueue(visitForm.visit_date);
      setSuccess('OPD visit closed successfully. Opening bill print...');
      router.push(`/billing?registrationId=${registration.id}&autoPrint=1`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const billColor = bill?.status === 'Paid'
    ? 'bg-green-50 border-green-200 text-green-700'
    : bill?.status === 'Partial'
      ? 'bg-orange-50 border-orange-200 text-orange-700'
      : 'bg-red-50 border-red-200 text-red-700';


  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')} className="p-0"><ArrowLeft className="w-5 h-5" /></Button>
          <div>
            <h1 className="font-bold text-slate-800">OPD Workflow - Professional HMS</h1>
            <p className="text-xs text-slate-500">Operator friendly panel for OPD registration, consultation, lab, billing and payment.</p>

          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 space-y-4">
        {error && <Alert className="bg-destructive/10 border-destructive/20"><AlertDescription className="text-destructive">{error}</AlertDescription></Alert>}
        {success && <Alert className="bg-green-500/10 border-green-500/20"><AlertDescription className="text-green-700">{success}</AlertDescription></Alert>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="p-4 space-y-3 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg">Patient Search / Create</h2>
              {selectedPatient && <p className="text-xs text-blue-700 font-semibold">Selected: {selectedPatient.first_name} ({selectedPatient.uhid})</p>}
            </div>

            <form onSubmit={handleSearchPatient} className="flex gap-2">
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by UHID / name / phone" />
              <Button type="submit" disabled={loading}><Search className="w-4 h-4 mr-1" />Search</Button>
            </form>
            <div className="max-h-40 overflow-auto space-y-2">
              {patients.length === 0 ? <p className="text-xs text-slate-400">No patient list yet. Search or create a patient.</p> : patients.map((p) => (

                <button key={p.id} onClick={() => setSelectedPatient(p)} className={`w-full text-left p-2 rounded border ${selectedPatient?.id === p.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}`}>
                  <p className="font-semibold text-sm">{p.first_name} {p.last_name || ''}</p>
                  <p className="text-xs text-slate-500">{p.uhid} • {p.phone || '-'}</p>
                </button>
              ))}
            </div>
            <form onSubmit={handleCreatePatient} className="grid grid-cols-2 gap-2 pt-2 border-t">
              <Input value={newPatient.first_name} onChange={(e) => setNewPatient((v) => ({ ...v, first_name: e.target.value }))} placeholder="First name*" required />
              <Input value={newPatient.last_name} onChange={(e) => setNewPatient((v) => ({ ...v, last_name: e.target.value }))} placeholder="Last name" />
              <Input value={newPatient.phone} onChange={(e) => setNewPatient((v) => ({ ...v, phone: e.target.value }))} placeholder="Phone*" required />
              <Select value={newPatient.gender} onValueChange={(v) => setNewPatient((val) => ({ ...val, gender: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>

              <div className="col-span-2 mt-1 p-3 rounded border bg-slate-50">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                  <input type="checkbox" checked={autoVisitOnCreate} onChange={(e) => setAutoVisitOnCreate(e.target.checked)} />
                  Auto-create OPD visit and token immediately after patient creation
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Input type="date" value={visitForm.visit_date} onChange={(e) => setVisitForm((v) => ({ ...v, visit_date: e.target.value }))} />
                  <Input value={visitForm.consultation_fee} onChange={(e) => setVisitForm((v) => ({ ...v, consultation_fee: e.target.value }))} placeholder="Doctor / consultation fee" />
                  <Select value={visitForm.doctor_id || 'none'} onValueChange={(v) => setVisitForm((val) => ({ ...val, doctor_id: v === 'none' ? '' : v }))}>
                    <SelectTrigger><SelectValue placeholder="Select Doctor" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Doctor</SelectItem>
                      {doctors.map((d) => (<SelectItem key={d.id} value={String(d.id)}>{d.name}{d.specialization ? ` (${d.specialization})` : ''}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  <Select value={visitForm.department_id || 'none'} onValueChange={(v) => setVisitForm((val) => ({ ...val, department_id: v === 'none' ? '' : v }))}>
                    <SelectTrigger><SelectValue placeholder="Select Department" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Department</SelectItem>
                      {departments.map((d) => (<SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </div>


              <Button type="submit" className="col-span-2" disabled={loading}><UserPlus className="w-4 h-4 mr-1" />Create Patient</Button>
            </form>
          </Card>

          <Card className="p-4 space-y-3">
            <h3 className="font-semibold">Visit / Queue Controls</h3>
            <p className="text-xs text-slate-500">Use when existing patient is selected.</p>
            <form onSubmit={handleCreateVisit} className="space-y-2">
              <Button className="w-full" type="submit" disabled={loading || !selectedPatient}>Create OPD Visit / Token</Button>
            </form>
            {registration && (
              <>
                <p className="text-xs text-green-700">Visit #{registration.id} • Token #{registration.token_number || '-'} • Queue: {registration.opd_visit_status || 'Waiting'}</p>
                <div className="grid grid-cols-1 gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => updateVisitStatus('Waiting')} disabled={loading}>Move to Waiting</Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => updateVisitStatus('In Consultation')} disabled={loading}>Move to In Consultation</Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => updateVisitStatus('Completed')} disabled={loading}>Move to Completed</Button>
                </div>
              </>
            )}
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="p-4 space-y-3">
            <h3 className="font-semibold">Doctor Consultation</h3>

            <form onSubmit={handleSaveConsultation} className="grid grid-cols-2 gap-2">
              <Input value={consultForm.symptoms} onChange={(e) => setConsultForm((v) => ({ ...v, symptoms: e.target.value }))} placeholder="Symptoms" />
              <Input value={consultForm.diagnosis} onChange={(e) => setConsultForm((v) => ({ ...v, diagnosis: e.target.value }))} placeholder="Diagnosis" />
              <Input value={consultForm.prescription_notes} onChange={(e) => setConsultForm((v) => ({ ...v, prescription_notes: e.target.value }))} placeholder="Prescription Notes" />
              <Input value={consultForm.advice} onChange={(e) => setConsultForm((v) => ({ ...v, advice: e.target.value }))} placeholder="Advice" />
              <Input type="date" value={consultForm.follow_up_date} onChange={(e) => setConsultForm((v) => ({ ...v, follow_up_date: e.target.value }))} />
              <Button type="submit" disabled={loading || !registration}><Stethoscope className="w-4 h-4 mr-1" />Save Consultation</Button>
            </form>
          </Card>

          <Card className="p-4 space-y-3">
            <h3 className="font-semibold">Add Services / Lab / Medicine</h3>

            <form onSubmit={handleAddService} className="grid grid-cols-2 gap-2">
              <Select value={serviceForm.item_type} onValueChange={(v) => setServiceForm((s) => ({ ...s, item_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="consultation">Consultation</SelectItem>
                  <SelectItem value="lab">Lab</SelectItem>
                  <SelectItem value="medicine">Medicine</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                </SelectContent>
              </Select>
              <Input value={serviceForm.name} onChange={(e) => setServiceForm((v) => ({ ...v, name: e.target.value }))} placeholder="Item name" required />
              <Input value={serviceForm.quantity} onChange={(e) => setServiceForm((v) => ({ ...v, quantity: e.target.value }))} placeholder="Qty" />
              <Input value={serviceForm.amount} onChange={(e) => setServiceForm((v) => ({ ...v, amount: e.target.value }))} placeholder="Amount" required />
              <Button type="submit" disabled={loading || !registration}><Pill className="w-4 h-4 mr-1" />Add Billing Item</Button>
            </form>
            <form onSubmit={handleAddLabOrder} className="grid grid-cols-2 gap-2 pt-2 border-t">
              <Input value={labForm.test_name} onChange={(e) => setLabForm({ test_name: e.target.value })} placeholder="Lab test name" required />
              <Button type="submit" disabled={loading || !registration}><FlaskConical className="w-4 h-4 mr-1" />Create Lab Order</Button>
            </form>
            <div className="space-y-1">
              {labOrders.map((o) => (
                <div key={o.id} className="flex justify-between items-center text-xs border rounded px-2 py-1">
                  <span>{o.test_name} - {o.status}</span>
                  <div className="flex gap-1">
                    {['Ordered', 'Sample Collected', 'Completed', 'Report Uploaded'].map((s) => (
                      <button key={s} className="px-1 py-0.5 border rounded" onClick={() => handleUpdateLabStatus(o.id, s)}>{s.split(' ')[0]}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className={`p-4 space-y-3 border-2 ${billColor}`}>
            <h3 className="font-semibold flex items-center gap-2"><BadgeIndianRupee className="w-4 h-4" />Unified Billing</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded bg-white/70 border"><p className="text-xs">Total</p><p className="font-bold text-lg">₹{Number(bill?.total_amount || 0).toFixed(2)}</p></div>
              <div className="p-2 rounded bg-white/70 border"><p className="text-xs">Paid</p><p className="font-bold text-lg">₹{Number(bill?.deposit_paid || 0).toFixed(2)}</p></div>
              <div className="p-2 rounded bg-white/70 border"><p className="text-xs">Due</p><p className="font-bold text-lg">₹{Number(bill?.amount_due || 0).toFixed(2)}</p></div>
              <div className="p-2 rounded bg-white/70 border"><p className="text-xs">Status</p><p className="font-bold text-lg">{bill?.status || 'Unpaid'}</p></div>
            </div>
            <div className="max-h-36 overflow-auto border rounded p-2 space-y-1 bg-white/80">

              {billItems.map((item) => (
                <p key={item.id} className="text-xs">{item.name} ({item.category}) - ₹{Number(item.amount).toFixed(2)}</p>
              ))}
            </div>
            <Button variant="outline" onClick={() => registration && router.push(`/billing?registrationId=${registration.id}`)} disabled={!registration}><Receipt className="w-4 h-4 mr-1" />Open Full Billing Page</Button>
          </Card>

          <Card className="p-4 space-y-3">
            <h3 className="font-semibold">Payment & OPD Closure</h3>

            <form onSubmit={handleCollectPayment} className="grid grid-cols-2 gap-2">
              <Input value={paymentForm.amount} onChange={(e) => setPaymentForm((v) => ({ ...v, amount: e.target.value }))} placeholder="Payment amount" required />
              <Select value={paymentForm.payment_mode} onValueChange={(v) => setPaymentForm((s) => ({ ...s, payment_mode: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="Card">Card</SelectItem>
                  <SelectItem value="Insurance">Insurance</SelectItem>
                </SelectContent>
              </Select>
              <Input className="col-span-2" value={paymentForm.reference_number} onChange={(e) => setPaymentForm((v) => ({ ...v, reference_number: e.target.value }))} placeholder="Reference / Txn ID" />
              <Button type="submit" disabled={loading || !registration}><Wallet className="w-4 h-4 mr-1" />Collect Payment</Button>
              <Button type="button" onClick={handleCompleteVisit} disabled={loading || !registration || bill?.status !== 'Paid'}><FileText className="w-4 h-4 mr-1" />Complete OPD Visit</Button>
            </form>

          </Card>
        </div>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center gap-2"><Users className="w-4 h-4" />OPD Token / Queue Board</h3>
            <div className="flex gap-2 items-center">
              <Input type="date" value={queueDate} onChange={(e) => setQueueDate(e.target.value)} className="w-auto" />
              <Button variant="outline" onClick={() => { loadQueue(queueDate); loadLabDashboard(queueDate); }} disabled={loading}>Refresh</Button>

            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { key: 'waiting', label: 'Waiting', rows: queue.waiting },
              { key: 'in_consultation', label: 'In Consultation', rows: queue.in_consultation },
              { key: 'completed', label: 'Completed', rows: queue.completed },
            ].map((col) => (
              <div key={col.key} className="border rounded p-2">
                <p className="text-sm font-semibold mb-2">{col.label} ({col.rows.length})</p>
                <div className="space-y-1 max-h-40 overflow-auto">
                  {col.rows.length === 0 ? <p className="text-xs text-slate-400">No patients</p> : col.rows.map((r) => (
                    <button key={r.id} onClick={() => refreshFlow(r.id)} className="w-full text-left border rounded p-1.5 hover:bg-slate-50">
                      <p className="text-xs font-semibold">Token #{r.token_number || '-'} • {r.first_name} {r.last_name || ''}</p>
                      <p className="text-[11px] text-slate-500">{r.uhid}</p>
                    </button>
                  ))}

                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold mb-2">Lab Department Orders (from OPD)</h3>
          <div className="max-h-56 overflow-auto space-y-2">
            {labDashboardOrders.length === 0 ? (
              <p className="text-xs text-slate-400">No lab orders for selected date.</p>
            ) : (
              labDashboardOrders.map((order) => (
                <div key={order.id} className="border rounded p-2 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{order.test_name}</p>
                    <p className="text-xs text-slate-500">
                      Token #{order.token_number || '-'} • {order.first_name} {order.last_name || ''} ({order.uhid})
                    </p>
                    <p className="text-xs text-slate-500">Status: {order.status}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => refreshFlow(order.registration_id)}>Open Visit</Button>
                </div>
              ))
            )}
          </div>
        </Card>

      </main>
    </div>
  );
}
