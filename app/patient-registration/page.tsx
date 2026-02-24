'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft, Search, Plus, User, CheckCircle, Printer, Copy,
  CreditCard, ClipboardList, Clock, Phone, Calendar, Droplets,
  MapPin, ChevronRight, X, Eye, IndianRupee, Stethoscope, BedDouble
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────
interface Patient {
  id: number; uhid: string; first_name: string; last_name?: string;
  gender?: string; date_of_birth?: string; phone?: string; email?: string;
  address?: string; city?: string; state?: string; pin_code?: string; blood_group?: string;
  created_at: string;
}
interface Registration {
  id: number; registration_type: string; admission_date: string; admission_time?: string;
  status: string; provisional_diagnosis?: string; department_id?: number; doctor_id?: number;
  room_type?: string; guardian_name?: string; guardian_relation?: string;
  guardian_phone?: string; insurance_company?: string; insurance_number?: string;
  rate_list?: string; created_at: string;
}
interface Department { id: number; name: string; }

// ─── Print Receipt Component ────────────────────────────────────────────────
function PrintReceipt({ patient, registration, deposit, deptName, onClose }:
  { patient: Patient; registration: Registration; deposit: number; deptName: string; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const now = new Date();

  const doPrint = () => {
    const html = ref.current?.innerHTML;
    if (!html) return;
    const w = window.open('', '_blank', 'width=800,height=600');
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>Registration Receipt</title><style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:'Segoe UI',Arial,sans-serif;font-size:12px;color:#1a1a1a;padding:24px}
      .header{text-align:center;border-bottom:3px double #1e3a8a;padding-bottom:14px;margin-bottom:16px}
      .co{font-size:22px;font-weight:900;color:#1e3a8a;letter-spacing:-0.5px}
      .co-sub{font-size:10px;color:#64748b;margin-top:2px}
      .receipt-title{font-size:14px;font-weight:700;color:#1e3a8a;margin:10px 0 4px;text-transform:uppercase;letter-spacing:1px}
      .receipt-no{font-size:10px;color:#64748b;font-family:monospace}
      .type-badge{display:inline-block;padding:3px 12px;border-radius:20px;font-size:11px;font-weight:800;margin-top:6px}
      .ipd{background:#dbeafe;color:#1e40af}.opd{background:#ede9fe;color:#5b21b6}
      .section{margin-bottom:14px;border:1px solid #e2e8f0;border-radius:6px;overflow:hidden}
      .sec-title{background:#f1f5f9;padding:6px 12px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.6px;color:#475569;border-bottom:1px solid #e2e8f0}
      .grid2{display:grid;grid-template-columns:1fr 1fr;gap:0}
      .cell{padding:7px 12px;border-bottom:1px solid #f1f5f9}
      .cell-label{font-size:9px;text-transform:uppercase;color:#94a3b8;font-weight:600;letter-spacing:.4px;margin-bottom:2px}
      .cell-val{font-size:12px;font-weight:600;color:#1a1a1a}
      .uhid-val{font-size:16px;font-weight:900;color:#1e3a8a;font-family:monospace}
      .deposit-box{background:#f0fdf4;border:2px solid #86efac;border-radius:8px;padding:14px;text-align:center;margin:14px 0}
      .dep-label{font-size:10px;font-weight:700;text-transform:uppercase;color:#166534;letter-spacing:.5px}
      .dep-amount{font-size:28px;font-weight:900;color:#16a34a;margin-top:4px}
      .dep-mode{font-size:11px;color:#166534;margin-top:2px}
      .footer{margin-top:20px;padding-top:12px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:flex-end;font-size:9px;color:#94a3b8}
      .sig{border-top:1px solid #94a3b8;width:140px;text-align:center;padding-top:4px;font-size:9px;color:#64748b}
      .no-deposit{background:#fffbeb;border:1px solid #fde68a;border-radius:6px;padding:8px 12px;font-size:11px;color:#92400e;text-align:center;margin:10px 0}
      @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
    </style></head><body>${html}</body></html>`);
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-slate-50 rounded-t-2xl flex-shrink-0">
          <div><h2 className="font-bold text-slate-800">Registration Receipt</h2><p className="text-xs text-slate-400">Preview before printing</p></div>
          <div className="flex gap-2">
            <Button onClick={doPrint} className="bg-blue-700 hover:bg-blue-800 gap-2 text-white"><Printer className="w-4 h-4"/>Print</Button>
            <Button variant="outline" size="sm" onClick={onClose}><X className="w-4 h-4"/></Button>
          </div>
        </div>
        <div className="overflow-y-auto flex-1 p-6 bg-white">
          <div ref={ref}>
            <div className="header" style={{textAlign:'center',borderBottom:'3px double #1e3a8a',paddingBottom:'14px',marginBottom:'16px'}}>
              <div style={{fontSize:'22px',fontWeight:'900',color:'#1e3a8a',letterSpacing:'-0.5px'}}>NItsat MedTech</div>
              <div style={{fontSize:'10px',color:'#64748b',marginTop:'2px'}}>Advanced Healthcare Solutions · Est. 2020</div>
              <div style={{fontSize:'10px',color:'#94a3b8',marginTop:'1px'}}>📍 Hospital Campus, Medical District · ☎ +91-XXXX-XXXX</div>
              <div style={{fontSize:'14px',fontWeight:'700',color:'#1e3a8a',margin:'10px 0 4px',textTransform:'uppercase',letterSpacing:'1px'}}>
                {registration.registration_type} Registration Receipt
              </div>
              <div style={{fontSize:'10px',color:'#64748b',fontFamily:'monospace'}}>REG-{registration.id?.toString().padStart(6,'0')} · {now.toLocaleDateString()} {now.toLocaleTimeString()}</div>
              <span style={{display:'inline-block',padding:'3px 12px',borderRadius:'20px',fontSize:'11px',fontWeight:'800',marginTop:'6px',
                background:registration.registration_type==='IPD'?'#dbeafe':'#ede9fe',
                color:registration.registration_type==='IPD'?'#1e40af':'#5b21b6'}}>
                {registration.registration_type === 'IPD' ? '🏥 In-Patient (IPD)' : '🏃 Out-Patient (OPD)'}
              </span>
            </div>

            {/* Patient Details */}
            <div style={{marginBottom:'14px',border:'1px solid #e2e8f0',borderRadius:'6px',overflow:'hidden'}}>
              <div style={{background:'#f1f5f9',padding:'6px 12px',fontSize:'10px',fontWeight:'800',textTransform:'uppercase',letterSpacing:'.6px',color:'#475569',borderBottom:'1px solid #e2e8f0'}}>
                Patient Details
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr'}}>
                {[
                  ['UHID', <span style={{fontSize:'16px',fontWeight:'900',color:'#1e3a8a',fontFamily:'monospace'}}>{patient.uhid}</span>],
                  ['Patient Name', `${patient.first_name} ${patient.last_name||''}`],
                  patient.gender && ['Gender', patient.gender],
                  patient.date_of_birth && ['Date of Birth', patient.date_of_birth],
                  patient.blood_group && ['Blood Group', <span style={{fontWeight:'800',color:'#dc2626'}}>{patient.blood_group}</span>],
                  patient.phone && ['Phone', patient.phone],
                  patient.email && ['Email', patient.email],
                  (patient.city||patient.address) && ['Address', [patient.address,patient.city,patient.state].filter(Boolean).join(', ')],
                ].filter(Boolean).map(([label,value]:any,i)=>(
                  <div key={i} style={{padding:'7px 12px',borderBottom:'1px solid #f1f5f9'}}>
                    <div style={{fontSize:'9px',textTransform:'uppercase',color:'#94a3b8',fontWeight:'600',letterSpacing:'.4px',marginBottom:'2px'}}>{label}</div>
                    <div style={{fontSize:'12px',fontWeight:'600',color:'#1a1a1a'}}>{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Admission Details */}
            <div style={{marginBottom:'14px',border:'1px solid #e2e8f0',borderRadius:'6px',overflow:'hidden'}}>
              <div style={{background:'#f1f5f9',padding:'6px 12px',fontSize:'10px',fontWeight:'800',textTransform:'uppercase',letterSpacing:'.6px',color:'#475569',borderBottom:'1px solid #e2e8f0'}}>
                Admission Details
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr'}}>
                {[
                  ['Admission Date', registration.admission_date],
                  registration.admission_time && ['Admission Time', registration.admission_time],
                  deptName && ['Department', deptName],
                  registration.room_type && ['Room Type', registration.room_type],
                  registration.rate_list && ['Rate List', registration.rate_list],
                  registration.provisional_diagnosis && ['Provisional Diagnosis', registration.provisional_diagnosis],
                  registration.guardian_name && ['Guardian', `${registration.guardian_name} (${registration.guardian_relation||''})`],
                  registration.guardian_phone && ['Guardian Phone', registration.guardian_phone],
                  registration.insurance_company && ['Insurance', `${registration.insurance_company} · ${registration.insurance_number||''}`],
                ].filter(Boolean).map(([label,value]:any,i)=>(
                  <div key={i} style={{padding:'7px 12px',borderBottom:'1px solid #f1f5f9'}}>
                    <div style={{fontSize:'9px',textTransform:'uppercase',color:'#94a3b8',fontWeight:'600',letterSpacing:'.4px',marginBottom:'2px'}}>{label}</div>
                    <div style={{fontSize:'12px',fontWeight:'600',color:'#1a1a1a'}}>{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Deposit */}
            {deposit > 0 ? (
              <div style={{background:'#f0fdf4',border:'2px solid #86efac',borderRadius:'8px',padding:'14px',textAlign:'center',margin:'14px 0'}}>
                <div style={{fontSize:'10px',fontWeight:'700',textTransform:'uppercase',color:'#166534',letterSpacing:'.5px'}}>Initial Deposit Collected</div>
                <div style={{fontSize:'28px',fontWeight:'900',color:'#16a34a',marginTop:'4px'}}>₹{deposit.toFixed(2)}</div>
                <div style={{fontSize:'11px',color:'#166534',marginTop:'2px'}}>Deposited at time of registration</div>
              </div>
            ) : (
              <div style={{background:'#fffbeb',border:'1px solid #fde68a',borderRadius:'6px',padding:'8px 12px',fontSize:'11px',color:'#92400e',textAlign:'center',margin:'10px 0'}}>
                No deposit collected at registration
              </div>
            )}

            {/* Footer */}
            <div style={{marginTop:'20px',paddingTop:'12px',borderTop:'1px solid #e2e8f0',display:'flex',justifyContent:'space-between',alignItems:'flex-end',fontSize:'9px',color:'#94a3b8'}}>
              <div>
                <div>Printed: {now.toLocaleString()}</div>
                <div>Reg ID: {registration.id} · Patient: {patient.id}</div>
                <div style={{marginTop:'3px',fontWeight:'600',color:'#64748b'}}>NItsat MedTech — Advanced Healthcare Solutions</div>
              </div>
              <div style={{borderTop:'1px solid #94a3b8',width:'140px',textAlign:'center',paddingTop:'4px',fontSize:'9px',color:'#64748b'}}>Authorized Signature</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function PatientRegistrationPage() {
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);

  // Mode: 'choose' | 'new' | 'existing'
  const [mode, setMode] = useState<'choose' | 'new' | 'existing'>('choose');

  // UHID Search
  const [uhidSearch, setUhidSearch] = useState('');
  const [uhidSearching, setUhidSearching] = useState(false);
  const [uhidResults, setUhidResults] = useState<Patient[]>([]);
  const [uhidSearched, setUhidSearched] = useState(false);

  // Selected / created patient
  const [patient, setPatient] = useState<Patient | null>(null);
  const [copied, setCopied] = useState(false);

  // Step for existing patient: 'select' | 'register'
  const [step, setStep] = useState<'select'|'form'|'done'>('select');

  // Registration list for existing patient
  const [pastRegs, setPastRegs] = useState<Registration[]>([]);

  // New patient form
  const [newPatientForm, setNewPatientForm] = useState({
    first_name:'', last_name:'', date_of_birth:'', gender:'',
    phone:'', email:'', address:'', city:'', state:'', pin_code:'', blood_group:''
  });

  // Registration form
  const [regForm, setRegForm] = useState({
    registration_type: 'OPD',
    department_id: '',
    admission_date: new Date().toISOString().split('T')[0],
    admission_time: new Date().toTimeString().slice(0,5),
    room_type: '',
    rate_list: 'COMMON',
    provisional_diagnosis: '',
    procedure_treatment: '',
    comments: '',
    guardian_name: '',
    guardian_relation: '',
    guardian_phone: '',
    insurance_company: '',
    insurance_number: '',
    // Deposit
    deposit_amount: '',
    deposit_mode: 'Cash',
    deposit_ref: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdReg, setCreatedReg] = useState<Registration | null>(null);
  const [depositAmount, setDepositAmount] = useState(0);

  // Print modal
  const [showPrint, setShowPrint] = useState(false);

  useEffect(() => {
    fetch('/api/departments').then(r=>r.json()).then(d=>setDepartments(Array.isArray(d)?d:[])).catch(()=>{});
  }, []);

  const loadPastRegs = async (patientId: number) => {
    try {
      const res = await fetch(`/api/registrations?patientId=${patientId}`);
      if (res.ok) setPastRegs(await res.json());
    } catch {}
  };

  // ─── UHID Search ────────────────────────────────────────────────────────
  const searchByUHID = async () => {
    if (!uhidSearch.trim()) return;
    setUhidSearching(true); setUhidSearched(true); setUhidResults([]);
    try {
      const res = await fetch(`/api/patients?search=${encodeURIComponent(uhidSearch)}`);
      if (res.ok) setUhidResults(await res.json());
    } catch {} finally { setUhidSearching(false); }
  };

  const pickExistingPatient = async (p: Patient) => {
    setPatient(p); setUhidResults([]); setUhidSearched(false); setUhidSearch('');
    await loadPastRegs(p.id);
    setStep('form');
  };

  // ─── New Patient Submit ──────────────────────────────────────────────────
  const handleCreatePatient = async () => {
    if (!newPatientForm.first_name) { setError('First name is required'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/patients', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify(newPatientForm)
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error||'Failed to create patient'); return; }
      setPatient(data);
      setStep('form');
    } catch { setError('Error creating patient'); } finally { setLoading(false); }
  };

  // ─── Registration Submit ─────────────────────────────────────────────────
  const handleRegister = async () => {
    if (!patient) return;
    setLoading(true); setError('');
    try {
      // 1. Create registration
      const regRes = await fetch('/api/registrations', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          patient_id: patient.id,
          registration_type: regForm.registration_type,
          department_id: regForm.department_id ? parseInt(regForm.department_id) : null,
          admission_date: regForm.admission_date,
          admission_time: regForm.admission_time,
          room_type: regForm.room_type||null,
          rate_list: regForm.rate_list,
          provisional_diagnosis: regForm.provisional_diagnosis||null,
          procedure_treatment: regForm.procedure_treatment||null,
          comments: regForm.comments||null,
          guardian_name: regForm.guardian_name||null,
          guardian_relation: regForm.guardian_relation||null,
          guardian_phone: regForm.guardian_phone||null,
          insurance_company: regForm.insurance_company||null,
          insurance_number: regForm.insurance_number||null,
        })
      });
      const regData = await regRes.json();
      if (!regRes.ok) { setError(regData.error||'Failed to register'); return; }
      const newReg: Registration = regData;

      // 2. Create bill + deposit if amount provided
      const depAmt = parseFloat(regForm.deposit_amount) || 0;
      if (depAmt > 0) {
        const billRes = await fetch('/api/billing', {
          method: 'POST', headers: {'Content-Type':'application/json'},
          body: JSON.stringify({ action:'create-bill', registration_id: newReg.id, initial_deposit: depAmt, gst_percent: 0 })
        });
        if (billRes.ok) {
          const billData = await billRes.json();
          // Record payment
          await fetch('/api/billing', {
            method: 'POST', headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ action:'add-payment', bill_id: billData.id, amount: depAmt, payment_mode: regForm.deposit_mode, reference_number: regForm.deposit_ref||undefined })
          });
        }
      }

      setCreatedReg(newReg);
      setDepositAmount(depAmt);
      setStep('done');
      await loadPastRegs(patient.id);
    } catch { setError('An error occurred'); } finally { setLoading(false); }
  };

  const copyUHID = () => {
    if (patient?.uhid) { navigator.clipboard.writeText(patient.uhid); setCopied(true); setTimeout(()=>setCopied(false),2000); }
  };

  const deptName = (id?: number) => departments.find(d=>d.id===id)?.name||'';
  const tf = (n:string, v:string) => setRegForm(f=>({...f,[n]:v}));

  const inputCls = "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 bg-white";
  const labelCls = "block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1";

  return (
    <>
      {showPrint && patient && createdReg && (
        <PrintReceipt
          patient={patient} registration={createdReg} deposit={depositAmount}
          deptName={deptName(createdReg.department_id)} onClose={()=>setShowPrint(false)}
        />
      )}

      <div className="min-h-screen bg-slate-100">
        {/* Header */}
        <header className="bg-white border-b shadow-sm sticky top-0 z-40">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={()=>router.push('/dashboard')} className="p-0">
              <ArrowLeft className="w-5 h-5"/>
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center">
                <ClipboardList className="w-4 h-4 text-white"/>
              </div>
              <div>
                <p className="font-bold text-slate-800 leading-none">Patient Registration</p>
                <p className="text-xs text-slate-400">NItsat MedTech · IPD / OPD</p>
              </div>
            </div>
            {patient && (
              <div className="ml-auto flex items-center gap-2 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg">
                <span className="text-xs font-bold text-blue-700 font-mono">{patient.uhid}</span>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs font-medium text-slate-600">{patient.first_name} {patient.last_name||''}</span>
              </div>
            )}
          </div>
        </header>

        <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">

          {/* ── STEP 0: Choose Mode ── */}
          {mode === 'choose' && (
            <div className="space-y-5">
              <div className="text-center py-4">
                <h2 className="text-2xl font-black text-slate-800">Register a Patient</h2>
                <p className="text-slate-500 text-sm mt-1">Is this a new patient or an existing one?</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                <button onClick={()=>setMode('new')}
                  className="group p-8 bg-white rounded-2xl border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all text-left shadow-sm">
                  <div className="w-14 h-14 bg-blue-100 group-hover:bg-blue-200 rounded-xl flex items-center justify-center mb-4 transition-colors">
                    <Plus className="w-7 h-7 text-blue-700"/>
                  </div>
                  <h3 className="font-black text-slate-800 text-lg">New Patient</h3>
                  <p className="text-sm text-slate-500 mt-1">First time visit — create patient record and register</p>
                  <div className="mt-4 flex items-center gap-1 text-blue-600 font-semibold text-sm">
                    Get Started <ChevronRight className="w-4 h-4"/>
                  </div>
                </button>
                <button onClick={()=>setMode('existing')}
                  className="group p-8 bg-white rounded-2xl border-2 border-slate-200 hover:border-purple-500 hover:bg-purple-50 transition-all text-left shadow-sm">
                  <div className="w-14 h-14 bg-purple-100 group-hover:bg-purple-200 rounded-xl flex items-center justify-center mb-4 transition-colors">
                    <Search className="w-7 h-7 text-purple-700"/>
                  </div>
                  <h3 className="font-black text-slate-800 text-lg">Existing Patient</h3>
                  <p className="text-sm text-slate-500 mt-1">Already has UHID — search by ID, name, or phone</p>
                  <div className="mt-4 flex items-center gap-1 text-purple-600 font-semibold text-sm">
                    Search Patient <ChevronRight className="w-4 h-4"/>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* ── EXISTING: Search by UHID ── */}
          {mode === 'existing' && step === 'select' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <button onClick={()=>setMode('choose')} className="text-slate-400 hover:text-slate-600"><ArrowLeft className="w-5 h-5"/></button>
                <h2 className="font-black text-xl text-slate-800">Search Existing Patient</h2>
              </div>
              <Card className="p-6">
                <p className={labelCls}>Search by UHID, Name or Phone</p>
                <div className="flex gap-2 mt-1">
                  <Input value={uhidSearch} onChange={e=>{setUhidSearch(e.target.value);setUhidSearched(false);}}
                    onKeyDown={e=>e.key==='Enter'&&searchByUHID()}
                    placeholder="e.g. UHID-2026-0001 or Ramesh or 9876..." className="flex-1"/>
                  <Button onClick={searchByUHID} disabled={uhidSearching} className="bg-blue-700 hover:bg-blue-800 text-white gap-2">
                    <Search className="w-4 h-4"/>{uhidSearching?'Searching...':'Search'}
                  </Button>
                </div>

                {uhidSearched && !uhidSearching && uhidResults.length === 0 && (
                  <div className="mt-4 text-center py-6 text-slate-400 text-sm">
                    No patient found. <button onClick={()=>setMode('new')} className="text-blue-600 font-semibold underline">Register as new patient?</button>
                  </div>
                )}

                {uhidResults.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs text-slate-400 font-medium">{uhidResults.length} result{uhidResults.length!==1?'s':''} found</p>
                    {uhidResults.map(p => (
                      <button key={p.id} onClick={()=>pickExistingPatient(p)}
                        className="w-full text-left p-4 bg-white border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50 rounded-xl transition-all flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-black text-lg flex-shrink-0">
                          {p.first_name[0]}{(p.last_name||'')[0]||''}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-800">{p.first_name} {p.last_name||''}</span>
                            <span className="font-mono text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">{p.uhid}</span>
                            {p.blood_group&&<span className="text-xs font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded">{p.blood_group}</span>}
                          </div>
                          <div className="flex gap-3 mt-1 text-xs text-slate-400 flex-wrap">
                            {p.gender&&<span>{p.gender}</span>}
                            {p.phone&&<span className="flex items-center gap-1"><Phone className="w-3 h-3"/>{p.phone}</span>}
                            {p.date_of_birth&&<span className="flex items-center gap-1"><Calendar className="w-3 h-3"/>DOB: {p.date_of_birth}</span>}
                            {p.city&&<span className="flex items-center gap-1"><MapPin className="w-3 h-3"/>{p.city}</span>}
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0"/>
                      </button>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* ── NEW PATIENT: Full form ── */}
          {mode === 'new' && step === 'select' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <button onClick={()=>setMode('choose')} className="text-slate-400 hover:text-slate-600"><ArrowLeft className="w-5 h-5"/></button>
                <h2 className="font-black text-xl text-slate-800">New Patient Details</h2>
              </div>

              <Card className="p-6 space-y-5">
                {/* Personal */}
                <div>
                  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
                    <User className="w-4 h-4 text-blue-600"/>
                    <span className="font-bold text-slate-700 text-sm">Personal Information</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="col-span-2">
                      <label className={labelCls}>First Name *</label>
                      <input className={inputCls} value={newPatientForm.first_name} onChange={e=>setNewPatientForm(f=>({...f,first_name:e.target.value}))} placeholder="e.g. Ramesh"/>
                    </div>
                    <div className="col-span-2">
                      <label className={labelCls}>Last Name</label>
                      <input className={inputCls} value={newPatientForm.last_name} onChange={e=>setNewPatientForm(f=>({...f,last_name:e.target.value}))} placeholder="e.g. Kumar"/>
                    </div>
                    <div>
                      <label className={labelCls}>Date of Birth</label>
                      <input type="date" className={inputCls} value={newPatientForm.date_of_birth} onChange={e=>setNewPatientForm(f=>({...f,date_of_birth:e.target.value}))}/>
                    </div>
                    <div>
                      <label className={labelCls}>Gender</label>
                      <select className={inputCls} value={newPatientForm.gender} onChange={e=>setNewPatientForm(f=>({...f,gender:e.target.value}))}>
                        <option value="">Select</option>
                        <option>Male</option><option>Female</option><option>Other</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Blood Group</label>
                      <select className={inputCls} value={newPatientForm.blood_group} onChange={e=>setNewPatientForm(f=>({...f,blood_group:e.target.value}))}>
                        <option value="">Select</option>
                        {['O+','O-','A+','A-','B+','B-','AB+','AB-'].map(g=><option key={g}>{g}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Phone</label>
                      <input className={inputCls} value={newPatientForm.phone} onChange={e=>setNewPatientForm(f=>({...f,phone:e.target.value}))} placeholder="9876543210"/>
                    </div>
                    <div className="col-span-2">
                      <label className={labelCls}>Email</label>
                      <input type="email" className={inputCls} value={newPatientForm.email} onChange={e=>setNewPatientForm(f=>({...f,email:e.target.value}))} placeholder="email@example.com"/>
                    </div>
                    <div className="col-span-2">
                      <label className={labelCls}>Address</label>
                      <input className={inputCls} value={newPatientForm.address} onChange={e=>setNewPatientForm(f=>({...f,address:e.target.value}))} placeholder="Street / Colony"/>
                    </div>
                    <div>
                      <label className={labelCls}>City</label>
                      <input className={inputCls} value={newPatientForm.city} onChange={e=>setNewPatientForm(f=>({...f,city:e.target.value}))} placeholder="Kanpur"/>
                    </div>
                    <div>
                      <label className={labelCls}>State</label>
                      <input className={inputCls} value={newPatientForm.state} onChange={e=>setNewPatientForm(f=>({...f,state:e.target.value}))} placeholder="UP"/>
                    </div>
                    <div>
                      <label className={labelCls}>Pin Code</label>
                      <input className={inputCls} value={newPatientForm.pin_code} onChange={e=>setNewPatientForm(f=>({...f,pin_code:e.target.value}))} placeholder="208001"/>
                    </div>
                  </div>
                </div>
                {error&&<p className="text-red-500 text-sm">{error}</p>}
                <Button onClick={handleCreatePatient} disabled={loading} className="bg-blue-700 hover:bg-blue-800 text-white">
                  {loading?'Creating...':'Create Patient & Continue →'}
                </Button>
              </Card>
            </div>
          )}

          {/* ── STEP: REGISTRATION FORM (shared for new + existing) ── */}
          {step === 'form' && patient && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <button onClick={()=>{setStep('select');setPatient(null);}} className="text-slate-400 hover:text-slate-600"><ArrowLeft className="w-5 h-5"/></button>
                <h2 className="font-black text-xl text-slate-800">Register Patient</h2>
              </div>

              {/* Patient Info Card */}
              <Card className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-blue-700 rounded-xl flex items-center justify-center text-white text-xl font-black flex-shrink-0">
                    {patient.first_name[0]}{(patient.last_name||'')[0]||''}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-black text-xl text-slate-800">{patient.first_name} {patient.last_name||''}</h3>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <span className="font-mono font-bold text-blue-700 bg-blue-100 border border-blue-200 px-2 py-0.5 rounded text-sm cursor-pointer flex items-center gap-1.5"
                        onClick={copyUHID} title="Click to copy">
                        {patient.uhid}
                        {copied ? <CheckCircle className="w-3 h-3 text-green-600"/> : <Copy className="w-3 h-3 opacity-50"/>}
                      </span>
                      {patient.gender&&<span className="text-xs bg-white border text-slate-600 px-2 py-0.5 rounded">{patient.gender}</span>}
                      {patient.blood_group&&<span className="text-xs font-bold text-red-700 bg-red-100 border border-red-200 px-2 py-0.5 rounded flex items-center gap-1"><Droplets className="w-3 h-3"/>{patient.blood_group}</span>}
                    </div>
                    <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-slate-500">
                      {patient.phone&&<span className="flex items-center gap-1"><Phone className="w-3 h-3"/>{patient.phone}</span>}
                      {patient.date_of_birth&&<span className="flex items-center gap-1"><Calendar className="w-3 h-3"/>DOB: {patient.date_of_birth}</span>}
                      {patient.city&&<span className="flex items-center gap-1"><MapPin className="w-3 h-3"/>{patient.city}</span>}
                    </div>
                  </div>
                </div>

                {/* Past Registrations */}
                {pastRegs.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-blue-200">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Past Visits ({pastRegs.length})</p>
                    <div className="flex gap-2 flex-wrap">
                      {pastRegs.map(r=>(
                        <div key={r.id} className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs">
                          <span className={`font-bold px-1.5 py-0.5 rounded text-xs ${r.registration_type==='IPD'?'bg-blue-100 text-blue-800':'bg-purple-100 text-purple-800'}`}>{r.registration_type}</span>
                          <span className="text-slate-600">{r.admission_date}</span>
                          <span className={`px-1.5 py-0.5 rounded text-xs ${r.status==='Active'?'bg-green-100 text-green-700':'bg-slate-100 text-slate-500'}`}>{r.status}</span>
                          <button onClick={()=>router.push(`/billing?registrationId=${r.id}`)} className="text-blue-600 hover:underline font-medium ml-1">Billing</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>

              {/* Registration Details Form */}
              <Card className="p-6 space-y-5">
                {/* Type Selection — BIG TOGGLE */}
                <div>
                  <label className={labelCls}>Registration Type *</label>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {[['OPD','Out-Patient','🏃','Walk-in / Day visit','purple'],['IPD','In-Patient','🏥','Admitted / Overnight','blue']].map(([type,label,icon,desc,color])=>(
                      <button key={type} type="button" onClick={()=>tf('registration_type',type)}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${regForm.registration_type===type
                          ? type==='OPD' ? 'border-purple-500 bg-purple-50' : 'border-blue-600 bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                        <div className="text-2xl mb-1">{icon}</div>
                        <div className={`font-black text-lg ${regForm.registration_type===type ? type==='OPD'?'text-purple-700':'text-blue-700' : 'text-slate-700'}`}>{type}</div>
                        <div className="font-semibold text-sm text-slate-600">{label}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="col-span-2">
                    <label className={labelCls}>Department</label>
                    <select className={inputCls} value={regForm.department_id} onChange={e=>tf('department_id',e.target.value)}>
                      <option value="">Select Department</option>
                      {departments.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Admission Date *</label>
                    <input type="date" className={inputCls} value={regForm.admission_date} onChange={e=>tf('admission_date',e.target.value)} required/>
                  </div>
                  <div>
                    <label className={labelCls}>Time</label>
                    <input type="time" className={inputCls} value={regForm.admission_time} onChange={e=>tf('admission_time',e.target.value)}/>
                  </div>
                  {regForm.registration_type === 'IPD' && (
                    <div>
                      <label className={labelCls}>Room Type</label>
                      <select className={inputCls} value={regForm.room_type} onChange={e=>tf('room_type',e.target.value)}>
                        <option value="">Select Room</option>
                        {['General Ward','Semi-Private','Private','ICU','NICU','PICU','Deluxe'].map(r=><option key={r}>{r}</option>)}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className={labelCls}>Rate List</label>
                    <select className={inputCls} value={regForm.rate_list} onChange={e=>tf('rate_list',e.target.value)}>
                      <option value="COMMON">COMMON</option>
                      <option value="GOVT">GOVT</option>
                      <option value="PRIVATE">PRIVATE</option>
                    </select>
                  </div>
                </div>

                {/* Medical */}
                <div>
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
                    <Stethoscope className="w-4 h-4 text-green-600"/>
                    <span className="font-bold text-slate-700 text-sm">Medical Information</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Provisional Diagnosis</label>
                      <textarea className={inputCls} rows={2} value={regForm.provisional_diagnosis} onChange={e=>tf('provisional_diagnosis',e.target.value)} placeholder="e.g. Acute Fever, Hypertension..."/>
                    </div>
                    <div>
                      <label className={labelCls}>Treatment / Procedure</label>
                      <textarea className={inputCls} rows={2} value={regForm.procedure_treatment} onChange={e=>tf('procedure_treatment',e.target.value)} placeholder="Planned treatment..."/>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className={labelCls}>Comments</label>
                      <textarea className={inputCls} rows={1} value={regForm.comments} onChange={e=>tf('comments',e.target.value)} placeholder="Any extra notes..."/>
                    </div>
                  </div>
                </div>

                {/* Guardian */}
                <div>
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
                    <User className="w-4 h-4 text-orange-600"/>
                    <span className="font-bold text-slate-700 text-sm">Guardian / Attendant</span>
                    <span className="text-xs text-slate-400">(optional)</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <label className={labelCls}>Guardian Name</label>
                      <input className={inputCls} value={regForm.guardian_name} onChange={e=>tf('guardian_name',e.target.value)} placeholder="Full name"/>
                    </div>
                    <div>
                      <label className={labelCls}>Relation</label>
                      <select className={inputCls} value={regForm.guardian_relation} onChange={e=>tf('guardian_relation',e.target.value)}>
                        <option value="">Select</option>
                        {['Father','Mother','Spouse','Son','Daughter','Sibling','Friend','Other'].map(r=><option key={r}>{r}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Guardian Phone</label>
                      <input className={inputCls} value={regForm.guardian_phone} onChange={e=>tf('guardian_phone',e.target.value)} placeholder="9876543210"/>
                    </div>
                  </div>
                </div>

                {/* Insurance */}
                <div>
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
                    <span className="text-base">🛡️</span>
                    <span className="font-bold text-slate-700 text-sm">Insurance</span>
                    <span className="text-xs text-slate-400">(optional)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Insurance Company</label>
                      <input className={inputCls} value={regForm.insurance_company} onChange={e=>tf('insurance_company',e.target.value)} placeholder="e.g. Star Health"/>
                    </div>
                    <div>
                      <label className={labelCls}>Policy / Card Number</label>
                      <input className={inputCls} value={regForm.insurance_number} onChange={e=>tf('insurance_number',e.target.value)} placeholder="Policy #"/>
                    </div>
                  </div>
                </div>

                {/* DEPOSIT — highlighted section */}
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <IndianRupee className="w-4 h-4 text-green-700"/>
                    <span className="font-bold text-green-800 text-sm">Initial Deposit</span>
                    <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">Collected at Registration</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className={labelCls}>Deposit Amount (₹)</label>
                      <input type="number" min="0" step="any" className={inputCls} value={regForm.deposit_amount}
                        onChange={e=>tf('deposit_amount',e.target.value)} placeholder="0.00"/>
                    </div>
                    <div>
                      <label className={labelCls}>Payment Mode</label>
                      <select className={inputCls} value={regForm.deposit_mode} onChange={e=>tf('deposit_mode',e.target.value)}>
                        <option value="Cash">💵 Cash</option>
                        <option value="Card">💳 Card</option>
                        <option value="UPI">📱 UPI</option>
                        <option value="Cheque">🏦 Cheque</option>
                        <option value="Insurance">🛡️ Insurance</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Reference / Txn ID</label>
                      <input className={inputCls} value={regForm.deposit_ref} onChange={e=>tf('deposit_ref',e.target.value)} placeholder="Optional"/>
                    </div>
                  </div>
                  {parseFloat(regForm.deposit_amount||'0') > 0 && (
                    <div className="mt-3 flex items-center gap-2 text-green-700 text-sm font-semibold">
                      <CheckCircle className="w-4 h-4"/> ₹{parseFloat(regForm.deposit_amount).toFixed(2)} will be collected via {regForm.deposit_mode}
                    </div>
                  )}
                </div>

                {error && <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}

                <Button onClick={handleRegister} disabled={loading} className="w-full bg-blue-700 hover:bg-blue-800 text-white h-12 text-base font-bold">
                  {loading ? 'Registering...' : `✓ Complete ${regForm.registration_type} Registration`}
                </Button>
              </Card>
            </div>
          )}

          {/* ── STEP DONE: Success + OPD List ── */}
          {step === 'done' && patient && createdReg && (
            <div className="space-y-4">
              {/* Success Banner */}
              <Card className="p-6 bg-green-50 border-2 border-green-300">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-8 h-8 text-white"/>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-black text-green-800">Registration Successful!</h2>
                    <p className="text-green-600 text-sm mt-0.5">
                      {createdReg.registration_type} registration completed for {patient.first_name} {patient.last_name||''}
                    </p>
                    <div className="flex flex-wrap gap-3 mt-3">
                      <div className="bg-white border border-green-200 rounded-lg px-3 py-2">
                        <p className="text-xs text-green-600 font-bold uppercase">UHID</p>
                        <p className="font-mono font-black text-blue-700 text-lg">{patient.uhid}</p>
                      </div>
                      <div className="bg-white border border-green-200 rounded-lg px-3 py-2">
                        <p className="text-xs text-green-600 font-bold uppercase">Type</p>
                        <p className="font-black text-slate-800">{createdReg.registration_type}</p>
                      </div>
                      <div className="bg-white border border-green-200 rounded-lg px-3 py-2">
                        <p className="text-xs text-green-600 font-bold uppercase">Date</p>
                        <p className="font-bold text-slate-800">{createdReg.admission_date}</p>
                      </div>
                      {depositAmount > 0 && (
                        <div className="bg-white border border-green-200 rounded-lg px-3 py-2">
                          <p className="text-xs text-green-600 font-bold uppercase">Deposit</p>
                          <p className="font-black text-green-700 text-lg">₹{depositAmount.toFixed(0)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  <Button onClick={()=>setShowPrint(true)} variant="outline" className="border-green-400 text-green-700 hover:bg-green-100 gap-2">
                    <Printer className="w-4 h-4"/>Print Receipt
                  </Button>
                  <Button onClick={()=>router.push(`/billing?uhid=${patient.uhid}`)} className="bg-blue-700 hover:bg-blue-800 text-white gap-2">
                    <CreditCard className="w-4 h-4"/>Open Billing
                  </Button>
                  <Button variant="outline" onClick={()=>{setMode('choose');setStep('select');setPatient(null);setCreatedReg(null);setDepositAmount(0);setError('');
                    setRegForm({registration_type:'OPD',department_id:'',admission_date:new Date().toISOString().split('T')[0],admission_time:new Date().toTimeString().slice(0,5),room_type:'',rate_list:'COMMON',provisional_diagnosis:'',procedure_treatment:'',comments:'',guardian_name:'',guardian_relation:'',guardian_phone:'',insurance_company:'',insurance_number:'',deposit_amount:'',deposit_mode:'Cash',deposit_ref:''});
                  }} className="gap-2">
                    <Plus className="w-4 h-4"/>New Registration
                  </Button>
                </div>
              </Card>

              {/* All Registrations for this patient */}
              <Card className="overflow-hidden">
                <div className="px-5 py-4 border-b bg-slate-50 flex items-center justify-between">
                  <h3 className="font-bold text-slate-700 flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-blue-600"/>
                    All Visits — {patient.first_name} {patient.last_name||''}
                    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">{pastRegs.length}</span>
                  </h3>
                </div>
                {pastRegs.length === 0 ? (
                  <p className="text-center text-slate-400 text-sm py-8">No visits found</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-slate-50 border-b">
                          {['Type','Date & Time','Department','Diagnosis','Status','Actions'].map(h=>(
                            <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wide">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {pastRegs.map((r,i)=>(
                          <tr key={r.id} className={`border-b hover:bg-slate-50 ${r.id===createdReg.id?'bg-green-50/50':''}`}>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded text-xs font-bold ${r.registration_type==='IPD'?'bg-blue-100 text-blue-800':'bg-purple-100 text-purple-800'}`}>
                                {r.registration_type}
                              </span>
                              {r.id===createdReg.id&&<span className="ml-2 text-xs font-bold text-green-600">NEW</span>}
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-sm font-semibold text-slate-800">{r.admission_date}</p>
                              {r.admission_time&&<p className="text-xs text-slate-400">{r.admission_time}</p>}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600">{deptName(r.department_id)||'—'}</td>
                            <td className="px-4 py-3 text-xs text-slate-500 max-w-32 truncate">{r.provisional_diagnosis||'—'}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                                r.status==='Active'?'bg-green-100 text-green-800 border-green-200':'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                {r.status}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-1.5">
                                <button onClick={()=>router.push(`/billing?registrationId=${r.id}`)}
                                  className="p-1.5 rounded border border-slate-200 text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-all" title="Billing">
                                  <CreditCard className="w-3.5 h-3.5"/>
                                </button>
                                <button onClick={()=>router.push(`/billing?registrationId=${r.id}`)}
                                  className="p-1.5 rounded border border-slate-200 text-slate-500 hover:border-slate-400 transition-all" title="View">
                                  <Eye className="w-3.5 h-3.5"/>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>

              {/* Next Steps Guide */}
              <Card className="p-5 bg-blue-50 border-blue-200">
                <h3 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                  <ChevronRight className="w-4 h-4"/>Next Steps for this Patient
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { icon:'💊', title:'Add Medicines', desc:'Add pharmacy items to the bill', action:()=>router.push(`/billing?uhid=${patient.uhid}`), btn:'Open Billing' },
                    { icon:'🔬', title:'Add Lab Tests', desc:'Add investigation charges', action:()=>router.push(`/billing?uhid=${patient.uhid}`), btn:'Add Tests' },
                    { icon:'🖨️', title:'Print Receipt', desc:'Print registration receipt now', action:()=>setShowPrint(true), btn:'Print' },
                  ].map(s=>(
                    <div key={s.title} className="bg-white rounded-xl border border-blue-200 p-4">
                      <div className="text-2xl mb-2">{s.icon}</div>
                      <p className="font-bold text-slate-700 text-sm">{s.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5 mb-3">{s.desc}</p>
                      <Button size="sm" variant="outline" onClick={s.action} className="text-xs border-blue-300 text-blue-700 hover:bg-blue-50">{s.btn}</Button>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </>
  );
}