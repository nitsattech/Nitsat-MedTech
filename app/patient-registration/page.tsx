'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  ArrowLeft, Search, Plus, User, CheckCircle, Printer, Copy,
  CreditCard, ClipboardList, Phone, Calendar, Droplets, MapPin,
  ChevronRight, X, IndianRupee, Stethoscope
} from 'lucide-react';

interface Patient { id:number; uhid:string; first_name:string; last_name?:string; gender?:string; date_of_birth?:string; phone?:string; email?:string; address?:string; city?:string; state?:string; pin_code?:string; blood_group?:string; created_at:string; }
interface Registration {
  procedure_treatment: string; id:number; registration_type:string; admission_date:string; admission_time?:string; discharge_date?:string; status:string; provisional_diagnosis?:string; department_id?:number; doctor_id?:number; doctor_name?:string; room_type?:string; bed_number?:string; guardian_name?:string; guardian_relation?:string; guardian_phone?:string; insurance_company?:string; insurance_number?:string; rate_list?:string; consultant_name?:string; referred_by?:string; additional_consultant?:string; nationality?:string; religion?:string; occupation?:string; marital_status?:string; id_document_type?:string; id_document_number?:string; tpa_name?:string; category?:string; dept_name?:string; created_at:string; 
}
interface Doctor { id:number; name:string; specialization?:string; qualification?:string; }
interface Department { id:number; name:string; }

// ─── Print Receipt ──────────────────────────────────────────────────────────
function PrintReceipt({ patient, registration, deposit, onClose }:
  { patient:Patient; registration:Registration; deposit:number; onClose:()=>void }) {
  const ref = useRef<HTMLDivElement>(null);
  const now = new Date();
  const age = patient.date_of_birth
    ? Math.floor((Date.now()-new Date(patient.date_of_birth).getTime())/31557600000) : null;

  const doPrint = () => {
    const html = ref.current?.innerHTML;
    if (!html) return;
    const w = window.open('','_blank','width=900,height=700');
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>Registration — ${patient.uhid}</title><style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:'Segoe UI',Arial,sans-serif;font-size:11px;color:#111;background:#fff}
      .page{padding:20px 28px;max-width:850px;margin:0 auto}
      .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #0f172a;padding-bottom:12px;margin-bottom:14px}
      .logo{font-size:26px;font-weight:900;color:#0f172a;letter-spacing:-1px}
      .logo span{color:#2563eb}
      .logo-sub{font-size:9px;color:#64748b;margin-top:1px}
      .header-right{text-align:right}
      .doc-title{font-size:13px;font-weight:800;color:#0f172a;text-transform:uppercase;letter-spacing:1px}
      .reg-type{display:inline-block;padding:3px 14px;border-radius:20px;font-size:11px;font-weight:800;margin-top:5px}
      .ipd{background:#dbeafe;color:#1e40af}.opd{background:#f3e8ff;color:#6b21a8}
      .reg-no{font-family:monospace;font-size:10px;color:#64748b;margin-top:4px}
      .two-col{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px}
      .box{border:1px solid #e2e8f0;border-radius:6px;overflow:hidden}
      .box-head{background:#1e293b;color:#fff;padding:5px 10px;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.8px}
      .box-body{padding:8px 10px}
      .field{display:flex;margin-bottom:4px;gap:6px}
      .fl{font-size:9px;color:#64748b;min-width:90px;flex-shrink:0;padding-top:1px}
      .fv{font-size:11px;font-weight:600;color:#0f172a;flex:1}
      .uhid-val{font-size:17px;font-weight:900;color:#2563eb;font-family:monospace}
      .consent{border:1px solid #e2e8f0;border-radius:6px;padding:10px;margin-top:10px;font-size:9px;line-height:1.6;color:#475569}
      .consent-title{font-size:10px;font-weight:800;text-transform:uppercase;border-bottom:1px solid #e2e8f0;padding-bottom:5px;margin-bottom:6px;color:#0f172a;text-align:center}
      .deposit-box{background:#f0fdf4;border:2px solid #86efac;border-radius:6px;padding:8px 12px;margin-top:10px;display:flex;justify-content:space-between;align-items:center}
      .dep-label{font-size:9px;font-weight:800;text-transform:uppercase;color:#166534}
      .dep-val{font-size:20px;font-weight:900;color:#16a34a}
      .no-dep{background:#fffbeb;border:1px solid #fde68a;border-radius:6px;padding:6px 10px;font-size:10px;color:#92400e;margin-top:8px}
      .sigs{display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;margin-top:20px;padding-top:12px;border-top:1px solid #e2e8f0}
      .sig{text-align:center}
      .sig-line{border-top:1px solid #94a3b8;width:100%;margin-bottom:4px;padding-top:4px;font-size:9px;color:#64748b}
      .footer{font-size:8px;color:#94a3b8;text-align:center;margin-top:12px;padding-top:8px;border-top:1px solid #f1f5f9}
      @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
    </style></head><body><div class="page">${html}</div></body></html>`);
    w.document.close(); setTimeout(()=>{w.focus();w.print();},400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-3 border-b bg-slate-50 rounded-t-2xl flex-shrink-0">
          <div><p className="font-bold text-slate-800">Registration Receipt</p><p className="text-xs text-slate-400 font-mono">{patient.uhid}</p></div>
          <div className="flex gap-2">
            <Button onClick={doPrint} className="bg-blue-700 hover:bg-blue-800 text-white gap-2"><Printer className="w-4 h-4"/>Print</Button>
            <Button variant="outline" size="sm" onClick={onClose}><X className="w-4 h-4"/></Button>
          </div>
        </div>
        <div className="overflow-y-auto flex-1 p-6">
          <div ref={ref}>
            {/* Header */}
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',borderBottom:'3px solid #0f172a',paddingBottom:'12px',marginBottom:'14px'}}>
              <div>
                <div style={{fontSize:'26px',fontWeight:'900',color:'#0f172a',letterSpacing:'-1px'}}>NItsat <span style={{color:'#2563eb'}}>MedTech</span></div>
                <div style={{fontSize:'9px',color:'#64748b',marginTop:'1px'}}>Advanced Healthcare Solutions · Est. 2020</div>
                <div style={{fontSize:'9px',color:'#94a3b8',marginTop:'1px'}}>📍 Hospital Campus, Medical District · ☎ +91-XXXX-XXXX · helpmyhms@gmail.com</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:'13px',fontWeight:'800',color:'#0f172a',textTransform:'uppercase',letterSpacing:'1px'}}>
                  {registration.registration_type} Registration
                </div>
                <span style={{display:'inline-block',padding:'3px 14px',borderRadius:'20px',fontSize:'11px',fontWeight:'800',marginTop:'5px',
                  background:registration.registration_type==='IPD'?'#dbeafe':'#f3e8ff',
                  color:registration.registration_type==='IPD'?'#1e40af':'#6b21a8'}}>
                  {registration.registration_type==='IPD'?'🏥 In-Patient':'🏃 Out-Patient'}
                </span>
                <div style={{fontFamily:'monospace',fontSize:'10px',color:'#64748b',marginTop:'4px'}}>
                  REG-{String(registration.id).padStart(6,'0')} · {registration.admission_date} {registration.admission_time||''}
                </div>
              </div>
            </div>

            {/* Two-column info */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'10px'}}>
              {/* Patient */}
              <div style={{border:'1px solid #e2e8f0',borderRadius:'6px',overflow:'hidden'}}>
                <div style={{background:'#1e293b',color:'#fff',padding:'5px 10px',fontSize:'9px',fontWeight:'800',textTransform:'uppercase',letterSpacing:'.8px'}}>Patient Details</div>
                <div style={{padding:'8px 10px'}}>
                  {[
                    ['UHID', <span style={{fontSize:'17px',fontWeight:'900',color:'#2563eb',fontFamily:'monospace'}}>{patient.uhid}</span>],
                    ['Name', `${registration.registration_type==='IPD'?'Mr./Ms. ':''}${patient.first_name} ${patient.last_name||''}`],
                    ['S/D/W/O', registration.guardian_name ? `${registration.guardian_name}${registration.guardian_relation?' — '+registration.guardian_relation:''}` : '—'],
                    ['Age/Gender/Marital', [age?`${age}Y`:null, patient.gender, registration.marital_status].filter(Boolean).join(' / ')||'—'],
                    ['Mobile / Blood Gp', `${patient.phone||'—'} / ${patient.blood_group||'NA'}`],
                    registration.religion && ['Religion', registration.religion],
                    registration.occupation && ['Occupation', registration.occupation],
                    ['Address', [patient.address,patient.city,patient.state].filter(Boolean).join(', ')||'—'],
                    registration.nationality && ['Nationality', registration.nationality],
                    registration.id_document_type && ['ID Document', `${registration.id_document_type}: ${registration.id_document_number||''}`],
                    ['Admission Date', `${registration.admission_date}${registration.admission_time?' '+registration.admission_time:''}`],
                  ].filter(Boolean).map(([l,v]:any,i)=>(
                    <div key={i} style={{display:'flex',marginBottom:'3px',gap:'6px'}}>
                      <span style={{fontSize:'9px',color:'#64748b',minWidth:'90px',flexShrink:0,paddingTop:'1px'}}>{l}</span>
                      <span style={{fontSize:'11px',fontWeight:'600',color:'#0f172a',flex:1}}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Admission */}
              <div style={{border:'1px solid #e2e8f0',borderRadius:'6px',overflow:'hidden'}}>
                <div style={{background:'#1e293b',color:'#fff',padding:'5px 10px',fontSize:'9px',fontWeight:'800',textTransform:'uppercase',letterSpacing:'.8px'}}>Admission Details</div>
                <div style={{padding:'8px 10px'}}>
                  {[
                    ['IPD No / Reg No', `${registration.registration_type}-${String(registration.id).padStart(4,'0')}`],
                    ['Insurance Co.', registration.insurance_company||'NA'],
                    ['Panel Name / TPA', registration.tpa_name||'NA'],
                    ['Billing Category', registration.category||'Cash'],
                    ['Allocation / Room', [registration.room_type, registration.bed_number?`Unit: ${registration.bed_number}`:null].filter(Boolean).join(' ')||'NA'],
                    ['Department', registration.dept_name||'—'],
                    ['Consultant', registration.doctor_name||registration.consultant_name||'—'],
                    registration.additional_consultant && ['Additional Consultant', registration.additional_consultant],
                    ['Referred By', registration.referred_by||'SELF'],
                    ['Rate List', registration.rate_list||'COMMON'],
                    ['Provisional Diagnosis', registration.provisional_diagnosis||'—'],
                    ['Procedure / Treatment', registration.procedure_treatment||'—'],
                  ].filter(Boolean).map(([l,v]:any,i)=>(
                    <div key={i} style={{display:'flex',marginBottom:'3px',gap:'6px'}}>
                      <span style={{fontSize:'9px',color:'#64748b',minWidth:'90px',flexShrink:0,paddingTop:'1px'}}>{l}</span>
                      <span style={{fontSize:'11px',fontWeight:'600',color:'#0f172a',flex:1}}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Deposit */}
            {deposit>0 ? (
              <div style={{background:'#f0fdf4',border:'2px solid #86efac',borderRadius:'6px',padding:'8px 12px',display:'flex',justifyContent:'space-between',alignItems:'center',margin:'8px 0'}}>
                <span style={{fontSize:'9px',fontWeight:'800',textTransform:'uppercase',color:'#166534'}}>Initial Deposit Collected</span>
                <span style={{fontSize:'20px',fontWeight:'900',color:'#16a34a'}}>₹{deposit.toFixed(2)}</span>
              </div>
            ) : (
              <div style={{background:'#fffbeb',border:'1px solid #fde68a',borderRadius:'6px',padding:'6px 10px',fontSize:'10px',color:'#92400e',margin:'8px 0'}}>
                No deposit collected at registration
              </div>
            )}

            {/* Consent */}
            <div style={{border:'1px solid #e2e8f0',borderRadius:'6px',padding:'10px',marginTop:'8px'}}>
              <div style={{fontSize:'10px',fontWeight:'800',textTransform:'uppercase',borderBottom:'1px solid #e2e8f0',paddingBottom:'5px',marginBottom:'6px',color:'#0f172a',textAlign:'center'}}>
                Informed Consent for {registration.registration_type==='IPD'?'Indoor':'Outpatient'} Treatment / उपचार के लिए सूचित सहमति
              </div>
              <p style={{fontSize:'9px',lineHeight:'1.6',color:'#475569'}}>
                मैं {patient.first_name} {patient.last_name||''} {registration.guardian_name?`के अभिभावक ${registration.guardian_name}`:''} इस अस्पताल NItsat MedTech में {registration.registration_type} भर्ती कराना चाहता/चाहती हूँ। 
                इलाज Dr. {registration.doctor_name||registration.consultant_name||'...'} के अंतर्गत करना चाहता हूँ।
                इस अस्पताल में आने का निर्णय विशुद्ध रूप से मेरे विवेक पर है।
                किसी ने भी / किसी अन्य चिकित्सीय संस्थान से मुझे जबरन प्रेरित नहीं किया।
                मैं अपने मरीज की देखभाल के लिए उपलब्ध सुविधाओं से परी तरह परिचित हूँ।
              </p>
            </div>

            {/* Signatures */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'20px',marginTop:'20px',paddingTop:'12px',borderTop:'1px solid #e2e8f0'}}>
              {['Patient / Guardian Signature','Consultant Signature','Receptionist / Authorised Signatory'].map(s=>(
                <div key={s} style={{textAlign:'center'}}>
                  <div style={{borderTop:'1px solid #94a3b8',width:'100%',marginBottom:'4px',paddingTop:'28px'}}/>
                  <div style={{fontSize:'8px',color:'#64748b'}}>{s}</div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={{fontSize:'8px',color:'#94a3b8',textAlign:'center',marginTop:'12px',paddingTop:'8px',borderTop:'1px solid #f1f5f9'}}>
              Printed: {now.toLocaleString()} · NItsat MedTech Advanced Healthcare Solutions · All rights reserved
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
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [mode, setMode] = useState<'choose'|'new'|'existing'>('choose');
  const [uhidSearch, setUhidSearch] = useState('');
  const [uhidSearching, setUhidSearching] = useState(false);
  const [uhidResults, setUhidResults] = useState<Patient[]>([]);
  const [uhidSearched, setUhidSearched] = useState(false);
  const [patient, setPatient] = useState<Patient|null>(null);
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState<'select'|'form'|'done'>('select');
  const [pastRegs, setPastRegs] = useState<Registration[]>([]);
  const [newForm, setNewForm] = useState({ first_name:'',last_name:'',date_of_birth:'',gender:'',phone:'',email:'',address:'',city:'',state:'',pin_code:'',blood_group:'' });
  const [regForm, setRegForm] = useState({
    registration_type:'OPD', department_id:'', doctor_id:'', additional_consultant:'', referred_by:'',
    admission_date:new Date().toISOString().split('T')[0], admission_time:new Date().toTimeString().slice(0,5),
    room_type:'', bed_number:'', rate_list:'COMMON', category:'Cash',
    provisional_diagnosis:'', procedure_treatment:'', comments:'',
    guardian_name:'', guardian_relation:'', guardian_phone:'',
    nationality:'India', religion:'', occupation:'', marital_status:'',
    id_document_type:'', id_document_number:'', tpa_name:'',
    insurance_company:'', insurance_number:'',
    deposit_amount:'', deposit_mode:'Cash', deposit_ref:'',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdReg, setCreatedReg] = useState<Registration|null>(null);
  const [depositAmount, setDepositAmount] = useState(0);
  const [showPrint, setShowPrint] = useState(false);

  useEffect(() => {
    fetch('/api/departments').then(r=>r.json()).then(d=>setDepartments(Array.isArray(d)?d:[])).catch(()=>{});
    fetch('/api/doctors').then(r=>r.json()).then(d=>setDoctors(Array.isArray(d)?d:[])).catch(()=>{});
  }, []);

  const loadPastRegs = async (pid:number) => {
    try { const r=await fetch(`/api/registrations?patientId=${pid}`); if(r.ok) setPastRegs(await r.json()); } catch{}
  };

  const searchPatient = async () => {
    if (!uhidSearch.trim()) return;
    setUhidSearching(true); setUhidSearched(true); setUhidResults([]);
    try { const r=await fetch(`/api/patients?search=${encodeURIComponent(uhidSearch)}`); if(r.ok) setUhidResults(await r.json()); }
    catch{} finally{setUhidSearching(false);}
  };

  const pickPatient = async (p:Patient) => {
    setPatient(p); setUhidResults([]); setUhidSearched(false); setUhidSearch('');
    await loadPastRegs(p.id); setStep('form');
  };

  const createPatient = async () => {
    if (!newForm.first_name) { setError('First name required'); return; }
    setLoading(true); setError('');
    try {
      const r=await fetch('/api/patients',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(newForm)});
      const d=await r.json(); if(!r.ok){setError(d.error||'Failed');return;}
      setPatient(d); setStep('form');
    } catch{setError('Error');} finally{setLoading(false);}
  };

  const register = async () => {
    if (!patient) return;
    setLoading(true); setError('');
    try {
      const selDoc = doctors.find(d=>d.id===parseInt(regForm.doctor_id));
      const r=await fetch('/api/registrations',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          patient_id:patient.id, ...regForm,
          doctor_id:regForm.doctor_id?parseInt(regForm.doctor_id):null,
          department_id:regForm.department_id?parseInt(regForm.department_id):null,
          consultant_name:selDoc?.name||null,
        })
      });
      const reg=await r.json(); if(!r.ok){setError(reg.error||'Failed');return;}
      const dep=parseFloat(regForm.deposit_amount)||0;
      if (dep>0) {
        const br=await fetch('/api/billing',{method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({action:'create-bill',registration_id:reg.id,initial_deposit:dep,gst_percent:0})});
        if(br.ok){const bd=await br.json();
          await fetch('/api/billing',{method:'POST',headers:{'Content-Type':'application/json'},
            body:JSON.stringify({action:'add-payment',bill_id:bd.id,amount:dep,payment_mode:regForm.deposit_mode,reference_number:regForm.deposit_ref||undefined})});
        }
      }
      setCreatedReg(reg); setDepositAmount(dep); setStep('done');
      await loadPastRegs(patient.id);
    } catch{setError('Error');} finally{setLoading(false);}
  };

  const reset = () => {
    setMode('choose'); setStep('select'); setPatient(null); setCreatedReg(null); setDepositAmount(0); setError('');
    setRegForm({registration_type:'OPD',department_id:'',doctor_id:'',additional_consultant:'',referred_by:'',admission_date:new Date().toISOString().split('T')[0],admission_time:new Date().toTimeString().slice(0,5),room_type:'',bed_number:'',rate_list:'COMMON',category:'Cash',provisional_diagnosis:'',procedure_treatment:'',comments:'',guardian_name:'',guardian_relation:'',guardian_phone:'',nationality:'India',religion:'',occupation:'',marital_status:'',id_document_type:'',id_document_number:'',tpa_name:'',insurance_company:'',insurance_number:'',deposit_amount:'',deposit_mode:'Cash',deposit_ref:''});
  };

  const tf = (n:string,v:string) => setRegForm(f=>({...f,[n]:v}));
  const ic = "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white";
  const lc = "block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1";

  const selectedDoc = doctors.find(d=>d.id===parseInt(regForm.doctor_id));

  return (
    <>
      {showPrint&&patient&&createdReg&&(
        <PrintReceipt patient={patient} registration={createdReg} deposit={depositAmount} onClose={()=>setShowPrint(false)}/>
      )}
      <div className="min-h-screen bg-slate-100">
        <header className="bg-white border-b shadow-sm sticky top-0 z-40">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={()=>router.push('/dashboard')} className="p-0"><ArrowLeft className="w-5 h-5"/></Button>
            <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center"><ClipboardList className="w-4 h-4 text-white"/></div>
            <div>
              <p className="font-bold text-slate-800 leading-none">Patient Registration</p>
              <p className="text-xs text-slate-400">NItsat MedTech · IPD / OPD</p>
            </div>
            <div className="ml-auto flex gap-2">
              <Button size="sm" variant="outline" onClick={()=>router.push('/mis')} className="gap-1.5 text-xs">
                <ClipboardList className="w-3.5 h-3.5"/>MIS / Occupancy
              </Button>
            </div>
          </div>
        </header>

        <div className="max-w-5xl mx-auto px-4 py-5 space-y-4">

          {/* CHOOSE */}
          {mode==='choose'&&(
            <div className="space-y-4">
              <div className="text-center py-3">
                <h2 className="text-2xl font-black text-slate-800">Register a Patient</h2>
                <p className="text-slate-500 text-sm mt-1">New patient or returning visit?</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                {[
                  {mode:'new' as const,icon:<Plus className="w-7 h-7 text-blue-700"/>,bg:'bg-blue-100',title:'New Patient',desc:'First time — create record & register',color:'border-blue-500 hover:bg-blue-50',btnColor:'text-blue-600'},
                  {mode:'existing' as const,icon:<Search className="w-7 h-7 text-purple-700"/>,bg:'bg-purple-100',title:'Existing Patient',desc:'Has UHID — search & register',color:'border-purple-500 hover:bg-purple-50',btnColor:'text-purple-600'},
                ].map(c=>(
                  <button key={c.mode} onClick={()=>setMode(c.mode)}
                    className={`group p-8 bg-white rounded-2xl border-2 border-slate-200 hover:${c.color} transition-all text-left shadow-sm`}>
                    <div className={`w-14 h-14 ${c.bg} rounded-xl flex items-center justify-center mb-4`}>{c.icon}</div>
                    <h3 className="font-black text-slate-800 text-lg">{c.title}</h3>
                    <p className="text-sm text-slate-500 mt-1">{c.desc}</p>
                    <div className={`mt-4 flex items-center gap-1 ${c.btnColor} font-semibold text-sm`}>Continue <ChevronRight className="w-4 h-4"/></div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* SEARCH EXISTING */}
          {mode==='existing'&&step==='select'&&(
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <button onClick={()=>setMode('choose')} className="text-slate-400 hover:text-slate-600"><ArrowLeft className="w-5 h-5"/></button>
                <h2 className="font-black text-xl text-slate-800">Search Existing Patient</h2>
              </div>
              <Card className="p-6">
                <label className={lc}>Search by UHID, Name or Phone</label>
                <div className="flex gap-2 mt-1">
                  <Input value={uhidSearch} onChange={e=>{setUhidSearch(e.target.value);setUhidSearched(false);}}
                    onKeyDown={e=>e.key==='Enter'&&searchPatient()} placeholder="e.g. UHID-2026-0001 or Ramesh..."/>
                  <Button onClick={searchPatient} disabled={uhidSearching} className="bg-blue-700 hover:bg-blue-800 text-white gap-2">
                    <Search className="w-4 h-4"/>{uhidSearching?'...':'Search'}
                  </Button>
                </div>
                {uhidSearched&&!uhidSearching&&uhidResults.length===0&&(
                  <div className="mt-4 text-center py-6 text-slate-400 text-sm">
                    No patient found. <button onClick={()=>setMode('new')} className="text-blue-600 font-semibold underline">Register as new?</button>
                  </div>
                )}
                {uhidResults.length>0&&(
                  <div className="mt-4 space-y-2">
                    {uhidResults.map(p=>(
                      <button key={p.id} onClick={()=>pickPatient(p)}
                        className="w-full text-left p-4 bg-white border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50 rounded-xl transition-all flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-black text-lg flex-shrink-0">
                          {p.first_name[0]}{(p.last_name||'')[0]||''}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-800">{p.first_name} {p.last_name||''}</span>
                            <span className="font-mono text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">{p.uhid}</span>
                            {p.blood_group&&<span className="text-xs font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded">{p.blood_group}</span>}
                          </div>
                          <div className="flex gap-3 mt-1 text-xs text-slate-400 flex-wrap">
                            {p.gender&&<span>{p.gender}</span>}
                            {p.phone&&<span className="flex items-center gap-1"><Phone className="w-3 h-3"/>{p.phone}</span>}
                            {p.date_of_birth&&<span><Calendar className="w-3 h-3 inline mr-1"/>DOB: {p.date_of_birth}</span>}
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-400"/>
                      </button>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* NEW PATIENT FORM */}
          {mode==='new'&&step==='select'&&(
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <button onClick={()=>setMode('choose')} className="text-slate-400 hover:text-slate-600"><ArrowLeft className="w-5 h-5"/></button>
                <h2 className="font-black text-xl text-slate-800">New Patient Details</h2>
              </div>
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
                  <User className="w-4 h-4 text-blue-600"/><span className="font-bold text-slate-700 text-sm">Personal Information</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="col-span-2"><label className={lc}>First Name *</label><input className={ic} value={newForm.first_name} onChange={e=>setNewForm(f=>({...f,first_name:e.target.value}))} placeholder="Ramesh"/></div>
                  <div className="col-span-2"><label className={lc}>Last Name</label><input className={ic} value={newForm.last_name} onChange={e=>setNewForm(f=>({...f,last_name:e.target.value}))} placeholder="Kumar"/></div>
                  <div><label className={lc}>Date of Birth</label><input type="date" className={ic} value={newForm.date_of_birth} onChange={e=>setNewForm(f=>({...f,date_of_birth:e.target.value}))}/></div>
                  <div><label className={lc}>Gender</label>
                    <select className={ic} value={newForm.gender} onChange={e=>setNewForm(f=>({...f,gender:e.target.value}))}>
                      <option value="">Select</option><option>Male</option><option>Female</option><option>Other</option>
                    </select>
                  </div>
                  <div><label className={lc}>Blood Group</label>
                    <select className={ic} value={newForm.blood_group} onChange={e=>setNewForm(f=>({...f,blood_group:e.target.value}))}>
                      <option value="">Select</option>{['O+','O-','A+','A-','B+','B-','AB+','AB-'].map(g=><option key={g}>{g}</option>)}
                    </select>
                  </div>
                  <div><label className={lc}>Phone</label><input className={ic} value={newForm.phone} onChange={e=>setNewForm(f=>({...f,phone:e.target.value}))} placeholder="9876543210"/></div>
                  <div className="col-span-2"><label className={lc}>Email</label><input type="email" className={ic} value={newForm.email} onChange={e=>setNewForm(f=>({...f,email:e.target.value}))} placeholder="email@example.com"/></div>
                  <div className="col-span-2"><label className={lc}>Address</label><input className={ic} value={newForm.address} onChange={e=>setNewForm(f=>({...f,address:e.target.value}))} placeholder="Street / Colony"/></div>
                  <div><label className={lc}>City</label><input className={ic} value={newForm.city} onChange={e=>setNewForm(f=>({...f,city:e.target.value}))} placeholder="Kanpur"/></div>
                  <div><label className={lc}>State</label><input className={ic} value={newForm.state} onChange={e=>setNewForm(f=>({...f,state:e.target.value}))} placeholder="UP"/></div>
                  <div><label className={lc}>Pin Code</label><input className={ic} value={newForm.pin_code} onChange={e=>setNewForm(f=>({...f,pin_code:e.target.value}))} placeholder="208001"/></div>
                </div>
                {error&&<p className="text-red-500 text-sm mt-3">{error}</p>}
                <Button onClick={createPatient} disabled={loading} className="mt-4 bg-blue-700 hover:bg-blue-800 text-white">{loading?'Creating...':'Create Patient & Continue →'}</Button>
              </Card>
            </div>
          )}

          {/* REGISTRATION FORM */}
          {step==='form'&&patient&&(
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <button onClick={()=>{setStep('select');setPatient(null);}} className="text-slate-400 hover:text-slate-600"><ArrowLeft className="w-5 h-5"/></button>
                <h2 className="font-black text-xl text-slate-800">Registration Details</h2>
              </div>

              {/* Patient Banner */}
              <Card className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-blue-700 rounded-xl flex items-center justify-center text-white text-xl font-black flex-shrink-0">
                    {patient.first_name[0]}{(patient.last_name||'')[0]||''}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-black text-xl text-slate-800">{patient.first_name} {patient.last_name||''}</h3>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <span className="font-mono font-bold text-blue-700 bg-blue-100 border border-blue-200 px-2 py-0.5 rounded text-sm cursor-pointer"
                        onClick={()=>{navigator.clipboard.writeText(patient.uhid);setCopied(true);setTimeout(()=>setCopied(false),2000);}}>
                        {patient.uhid}{copied&&' ✓'}
                      </span>
                      {patient.gender&&<span className="text-xs bg-white border text-slate-600 px-2 py-0.5 rounded">{patient.gender}</span>}
                      {patient.blood_group&&<span className="text-xs font-bold text-red-700 bg-red-100 border border-red-200 px-2 py-0.5 rounded">{patient.blood_group}</span>}
                    </div>
                    <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-slate-500">
                      {patient.phone&&<span className="flex items-center gap-1"><Phone className="w-3 h-3"/>{patient.phone}</span>}
                      {patient.date_of_birth&&<span><Calendar className="w-3 h-3 inline mr-1"/>DOB: {patient.date_of_birth}</span>}
                      {patient.city&&<span><MapPin className="w-3 h-3 inline mr-1"/>{patient.city}</span>}
                    </div>
                  </div>
                </div>
                {pastRegs.length>0&&(
                  <div className="mt-4 pt-3 border-t border-blue-200">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Past Visits</p>
                    <div className="flex gap-2 flex-wrap">
                      {pastRegs.map(r=>(
                        <div key={r.id} className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs">
                          <span className={`font-bold px-1.5 py-0.5 rounded ${r.registration_type==='IPD'?'bg-blue-100 text-blue-800':'bg-purple-100 text-purple-800'}`}>{r.registration_type}</span>
                          <span className="text-slate-600">{r.admission_date}</span>
                          <span className={r.status==='Active'?'text-green-600 font-bold':'text-slate-400'}>{r.status}</span>
                          <button onClick={()=>router.push(`/billing?registrationId=${r.id}`)} className="text-blue-600 font-semibold ml-1">Bill</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>

              <Card className="p-6 space-y-5">
                {/* Type */}
                <div>
                  <label className={lc}>Registration Type *</label>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {[['OPD','🏃','Out-Patient','Walk-in / Day visit'],['IPD','🏥','In-Patient','Admitted / Overnight']].map(([type,icon,label,desc])=>(
                      <button key={type} type="button" onClick={()=>tf('registration_type',type)}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${regForm.registration_type===type
                          ?type==='OPD'?'border-purple-500 bg-purple-50':'border-blue-600 bg-blue-50'
                          :'border-slate-200 hover:border-slate-300 bg-white'}`}>
                        <div className="text-2xl mb-1">{icon}</div>
                        <div className={`font-black text-lg ${regForm.registration_type===type?type==='OPD'?'text-purple-700':'text-blue-700':'text-slate-700'}`}>{type}</div>
                        <div className="font-semibold text-sm text-slate-600">{label}</div>
                        <div className="text-xs text-slate-400">{desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date/Time/Dept */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div><label className={lc}>Admission Date *</label><input type="date" className={ic} value={regForm.admission_date} onChange={e=>tf('admission_date',e.target.value)} required/></div>
                  <div><label className={lc}>Time</label><input type="time" className={ic} value={regForm.admission_time} onChange={e=>tf('admission_time',e.target.value)}/></div>
                  <div className="col-span-2"><label className={lc}>Department</label>
                    <select className={ic} value={regForm.department_id} onChange={e=>tf('department_id',e.target.value)}>
                      <option value="">Select Department</option>
                      {departments.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                </div>

                {/* Doctor section — highlighted */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Stethoscope className="w-4 h-4 text-blue-700"/>
                    <span className="font-bold text-blue-800 text-sm">Consultant / Doctor</span>
                    <span className="text-xs text-blue-500 bg-blue-100 px-2 py-0.5 rounded-full">Attending Physician</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className={lc}>Consultant (Primary) *</label>
                      <select className={ic} value={regForm.doctor_id} onChange={e=>tf('doctor_id',e.target.value)}>
                        <option value="">Select Doctor</option>
                        {doctors.map(d=><option key={d.id} value={d.id}>Dr. {d.name}{d.specialization?` — ${d.specialization}`:''}</option>)}
                      </select>
                      {selectedDoc&&<p className="text-xs text-blue-600 mt-1 font-medium">{selectedDoc.qualification||''}</p>}
                    </div>
                    <div>
                      <label className={lc}>Additional Consultant</label>
                      <input className={ic} value={regForm.additional_consultant} onChange={e=>tf('additional_consultant',e.target.value)} placeholder="Dr. Name (optional)"/>
                    </div>
                    <div>
                      <label className={lc}>Referred By</label>
                      <input className={ic} value={regForm.referred_by} onChange={e=>tf('referred_by',e.target.value)} placeholder="SELF / Dr. Name / Hospital"/>
                    </div>
                  </div>
                </div>

                {/* Room + Rate + Category */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {regForm.registration_type==='IPD'&&<>
                    <div><label className={lc}>Room Type</label>
                      <select className={ic} value={regForm.room_type} onChange={e=>tf('room_type',e.target.value)}>
                        <option value="">Select</option>
                        {['General Ward','Semi-Private','Private','ICU','NICU','PICU','Deluxe'].map(r=><option key={r}>{r}</option>)}
                      </select>
                    </div>
                    <div><label className={lc}>Bed / Unit No.</label><input className={ic} value={regForm.bed_number} onChange={e=>tf('bed_number',e.target.value)} placeholder="e.g. 12"/></div>
                  </>}
                  <div><label className={lc}>Rate List</label>
                    <select className={ic} value={regForm.rate_list} onChange={e=>tf('rate_list',e.target.value)}>
                      {['COMMON','GOVT','PRIVATE'].map(r=><option key={r}>{r}</option>)}
                    </select>
                  </div>
                  <div><label className={lc}>Category</label>
                    <select className={ic} value={regForm.category} onChange={e=>tf('category',e.target.value)}>
                      {['Cash','Card','UPI','TPA','Insurance','CGHS','ESI'].map(c=><option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                {/* Medical */}
                <div>
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
                    <span className="text-base">🩺</span><span className="font-bold text-slate-700 text-sm">Medical Information</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div><label className={lc}>Provisional Diagnosis</label><textarea className={ic} rows={2} value={regForm.provisional_diagnosis} onChange={e=>tf('provisional_diagnosis',e.target.value)} placeholder="e.g. Dengue, Hypertension..."/></div>
                    <div><label className={lc}>Treatment / Procedure</label><textarea className={ic} rows={2} value={regForm.procedure_treatment} onChange={e=>tf('procedure_treatment',e.target.value)} placeholder="Planned treatment..."/></div>
                    <div className="col-span-2 md:col-span-1"><label className={lc}>Comments</label><textarea className={ic} rows={1} value={regForm.comments} onChange={e=>tf('comments',e.target.value)} placeholder="Any extra notes..."/></div>
                  </div>
                </div>

                {/* Patient demographics (for print) */}
                <div>
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
                    <User className="w-4 h-4 text-slate-500"/><span className="font-bold text-slate-700 text-sm">Additional Demographics</span><span className="text-xs text-slate-400">(for records &amp; print)</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div><label className={lc}>Marital Status</label>
                      <select className={ic} value={regForm.marital_status} onChange={e=>tf('marital_status',e.target.value)}>
                        <option value="">Select</option>{['Single','Married','Widowed','Divorced'].map(s=><option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div><label className={lc}>Religion</label><input className={ic} value={regForm.religion} onChange={e=>tf('religion',e.target.value)} placeholder="Hindu/Muslim/..."/></div>
                    <div><label className={lc}>Occupation</label><input className={ic} value={regForm.occupation} onChange={e=>tf('occupation',e.target.value)} placeholder="e.g. Govt Service"/></div>
                    <div><label className={lc}>Nationality</label><input className={ic} value={regForm.nationality} onChange={e=>tf('nationality',e.target.value)} placeholder="India"/></div>
                    <div><label className={lc}>ID Document</label>
                      <select className={ic} value={regForm.id_document_type} onChange={e=>tf('id_document_type',e.target.value)}>
                        <option value="">Select Type</option>{['Aadhar','PAN','Passport','Voter ID','Driving License'].map(d=><option key={d}>{d}</option>)}
                      </select>
                    </div>
                    <div className="col-span-2"><label className={lc}>Document Number</label><input className={ic} value={regForm.id_document_number} onChange={e=>tf('id_document_number',e.target.value)} placeholder="e.g. 1234-5678-9012"/></div>
                  </div>
                </div>

                {/* Guardian */}
                <div>
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
                    <User className="w-4 h-4 text-orange-500"/><span className="font-bold text-slate-700 text-sm">Guardian / Attendant</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div><label className={lc}>Guardian Name</label><input className={ic} value={regForm.guardian_name} onChange={e=>tf('guardian_name',e.target.value)} placeholder="Full name"/></div>
                    <div><label className={lc}>Relation</label>
                      <select className={ic} value={regForm.guardian_relation} onChange={e=>tf('guardian_relation',e.target.value)}>
                        <option value="">Select</option>{['Father','Mother','Spouse','Son','Daughter','Sibling','Friend','Other'].map(r=><option key={r}>{r}</option>)}
                      </select>
                    </div>
                    <div><label className={lc}>Phone</label><input className={ic} value={regForm.guardian_phone} onChange={e=>tf('guardian_phone',e.target.value)} placeholder="9876543210"/></div>
                  </div>
                </div>

                {/* Insurance / TPA */}
                <div>
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
                    <span className="text-base">🛡️</span><span className="font-bold text-slate-700 text-sm">Insurance / TPA</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div><label className={lc}>Insurance Company</label><input className={ic} value={regForm.insurance_company} onChange={e=>tf('insurance_company',e.target.value)} placeholder="e.g. Star Health"/></div>
                    <div><label className={lc}>Policy Number</label><input className={ic} value={regForm.insurance_number} onChange={e=>tf('insurance_number',e.target.value)} placeholder="Policy #"/></div>
                    <div><label className={lc}>TPA Name</label><input className={ic} value={regForm.tpa_name} onChange={e=>tf('tpa_name',e.target.value)} placeholder="TPA / Panel Name"/></div>
                  </div>
                </div>

                {/* Deposit */}
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <IndianRupee className="w-4 h-4 text-green-700"/>
                    <span className="font-bold text-green-800 text-sm">Initial Deposit</span>
                    <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">Collected at Registration</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div><label className={lc}>Deposit Amount (₹)</label><input type="number" min="0" className={ic} value={regForm.deposit_amount} onChange={e=>tf('deposit_amount',e.target.value)} placeholder="0.00"/></div>
                    <div><label className={lc}>Payment Mode</label>
                      <select className={ic} value={regForm.deposit_mode} onChange={e=>tf('deposit_mode',e.target.value)}>
                        {['Cash','Card','UPI','Cheque','Insurance'].map(m=><option key={m}>{m}</option>)}
                      </select>
                    </div>
                    <div><label className={lc}>Reference / Txn ID</label><input className={ic} value={regForm.deposit_ref} onChange={e=>tf('deposit_ref',e.target.value)} placeholder="Optional"/></div>
                  </div>
                  {parseFloat(regForm.deposit_amount||'0')>0&&(
                    <div className="mt-2 text-green-700 text-sm font-semibold flex items-center gap-2">
                      <CheckCircle className="w-4 h-4"/>₹{parseFloat(regForm.deposit_amount).toFixed(2)} via {regForm.deposit_mode}
                    </div>
                  )}
                </div>

                {error&&<p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}
                <Button onClick={register} disabled={loading} className="w-full bg-blue-700 hover:bg-blue-800 text-white h-12 text-base font-bold">
                  {loading?'Registering...':`✓ Complete ${regForm.registration_type} Registration`}
                </Button>
              </Card>
            </div>
          )}

          {/* DONE */}
          {step==='done'&&patient&&createdReg&&(
            <div className="space-y-4">
              {/* Success */}
              <Card className="p-6 bg-green-50 border-2 border-green-300">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-8 h-8 text-white"/>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-black text-green-800">Registration Successful!</h2>
                    <p className="text-green-600 text-sm">{createdReg.registration_type} registration for {patient.first_name} {patient.last_name||''}</p>
                    <div className="flex flex-wrap gap-3 mt-3">
                      {[
                        ['UHID', patient.uhid, 'font-mono text-blue-700 font-black text-lg'],
                        ['Type', createdReg.registration_type, 'font-bold text-slate-800'],
                        ['Date', createdReg.admission_date, 'font-bold text-slate-800'],
                        ['Doctor', createdReg.doctor_name||createdReg.consultant_name||'—', 'font-bold text-slate-800 text-sm'],
                        depositAmount>0 && ['Deposit', `₹${depositAmount.toFixed(0)}`, 'font-black text-green-700 text-lg'],
                      ].filter(Boolean).map(([label,val,cls]:any)=>(
                        <div key={label} className="bg-white border border-green-200 rounded-lg px-3 py-2">
                          <p className="text-xs text-green-600 font-bold uppercase">{label}</p>
                          <p className={cls}>{val}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-green-200">
                  <Button onClick={()=>setShowPrint(true)} variant="outline" className="border-green-400 text-green-700 hover:bg-green-100 gap-2">
                    <Printer className="w-4 h-4"/>Print Receipt
                  </Button>
                  <Button onClick={()=>router.push(`/billing?uhid=${patient.uhid}`)} className="bg-blue-700 hover:bg-blue-800 text-white gap-2">
                    <CreditCard className="w-4 h-4"/>Open Billing
                  </Button>
                  <Button onClick={()=>router.push('/mis')} variant="outline" className="gap-2">
                    <ClipboardList className="w-4 h-4"/>View MIS
                  </Button>
                  <Button variant="outline" onClick={reset} className="gap-2">
                    <Plus className="w-4 h-4"/>New Registration
                  </Button>
                </div>
              </Card>

              {/* All registrations table */}
              <Card className="overflow-hidden">
                <div className="px-5 py-3 border-b bg-slate-50 flex items-center justify-between">
                  <h3 className="font-bold text-slate-700 flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-blue-600"/>All Visits — {patient.first_name}
                    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">{pastRegs.length}</span>
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead><tr className="bg-slate-50 border-b">
                      {['Type','Date','Dept','Doctor','Diagnosis','Status',''].map(h=>(
                        <th key={h} className="px-3 py-2.5 text-left text-xs font-bold text-slate-400 uppercase">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {pastRegs.map(r=>(
                        <tr key={r.id} className={`border-b hover:bg-slate-50 ${r.id===createdReg.id?'bg-green-50/50':''}`}>
                          <td className="px-3 py-2.5"><span className={`px-2 py-1 rounded text-xs font-bold ${r.registration_type==='IPD'?'bg-blue-100 text-blue-800':'bg-purple-100 text-purple-800'}`}>{r.registration_type}</span>{r.id===createdReg.id&&<span className="ml-1 text-xs text-green-600 font-bold">NEW</span>}</td>
                          <td className="px-3 py-2.5 text-sm">{r.admission_date}<br/><span className="text-xs text-slate-400">{r.admission_time||''}</span></td>
                          <td className="px-3 py-2.5 text-xs text-slate-600">{r.dept_name||'—'}</td>
                          <td className="px-3 py-2.5 text-xs text-slate-600">{r.doctor_name||r.consultant_name||'—'}</td>
                          <td className="px-3 py-2.5 text-xs text-slate-500 max-w-28 truncate">{r.provisional_diagnosis||'—'}</td>
                          <td className="px-3 py-2.5"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${r.status==='Active'?'bg-green-100 text-green-800':'bg-slate-100 text-slate-600'}`}>{r.status}</span></td>
                          <td className="px-3 py-2.5">
                            <div className="flex gap-1">
                              <button onClick={()=>setShowPrint(true)} className="p-1.5 rounded border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-300" title="Print"><Printer className="w-3.5 h-3.5"/></button>
                              <button onClick={()=>router.push(`/billing?registrationId=${r.id}`)} className="p-1.5 rounded border border-slate-200 text-slate-400 hover:text-green-600 hover:border-green-300" title="Billing"><CreditCard className="w-3.5 h-3.5"/></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </>
  );
}