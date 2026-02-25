'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ArrowLeft, Plus, Printer, CheckCircle, Search, User, Clock, Phone,
  Droplets, Calendar, X, Eye, Receipt, Trash2, Pencil, Save, AlertCircle,
  FlaskConical, Pill, BedDouble, Stethoscope, MoreHorizontal, ChevronDown, ChevronRight,
  CreditCard
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────
interface Patient { id: number; uhid: string; first_name: string; last_name?: string; gender?: string; date_of_birth?: string; phone?: string; email?: string; address?: string; city?: string; state?: string; blood_group?: string; created_at: string; }
interface Registration { id: number; registration_type: string; admission_date: string; admission_time?: string; discharge_date?: string; status: string; provisional_diagnosis?: string; procedure_treatment?: string; guardian_name?: string; guardian_relation?: string; guardian_phone?: string; insurance_company?: string; insurance_number?: string; doctor_id?: number; department_id?: number; room_type?: string; }
interface BillItem { id: number; bill_id: number; category: string; name: string; description?: string; quantity: number; unit: string; rate: number; amount: number; batch_number?: string; expiry_date?: string; created_at: string; }
interface Bill { id: number; registration_id: number; bill_number: string; bill_date: string; gst_percent: number; gst_amount: number; subtotal: number; total_medicine_amount: number; total_investigation_amount: number; total_bed_amount: number; total_doctor_amount: number; total_other_amount: number; total_amount: number; deposit_paid: number; amount_due: number; status: string; }
interface Payment { id: number; bill_id: number; amount: number; payment_mode: string; reference_number?: string; payment_date: string; }
interface Department { id: number; name: string; }

const CATEGORIES = [
  { key: 'medicine', label: 'Medicine / Pharmacy', icon: '💊', color: 'text-purple-600 bg-purple-50 border-purple-200' },
  { key: 'lab', label: 'Lab / Investigation', icon: '🔬', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { key: 'bed', label: 'Bed / Room Charges', icon: '🛏️', color: 'text-green-600 bg-green-50 border-green-200' },
  { key: 'doctor', label: 'Doctor / Consultation', icon: '👨‍⚕️', color: 'text-orange-600 bg-orange-50 border-orange-200' },
  { key: 'other', label: 'Other Charges', icon: '📋', color: 'text-slate-600 bg-slate-50 border-slate-200' },
];

const catInfo = (key: string) => CATEGORIES.find(c => c.key === key) || CATEGORIES[4];

const STATUS_COLORS: Record<string, string> = {
  Paid: 'bg-green-100 text-green-800 border-green-300',
  Partial: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  Unpaid: 'bg-red-100 text-red-800 border-red-300',
  Active: 'bg-blue-100 text-blue-800 border-blue-300',
};

// ─── Print Bill Modal ──────────────────────────────────────────────────────
function PrintModal({ patient, registration, bill, items, payments, departments, onClose }:
  { patient: Patient; registration: Registration; bill: Bill; items: BillItem[]; payments: Payment[]; departments: Department[]; onClose: () => void }) {
  const printRef = useRef<HTMLDivElement>(null);
  const dept = departments.find(d => d.id === registration.department_id);
  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);

  const groupedItems = CATEGORIES.reduce((acc, cat) => {
    acc[cat.key] = items.filter(i => i.category === cat.key);
    return acc;
  }, {} as Record<string, BillItem[]>);

  const handlePrint = () => {
    const content = printRef.current?.innerHTML;
    if (!content) return;
    const win = window.open('', '_blank', 'width=900,height=750');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>${bill.bill_number}</title><style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:'Segoe UI',Arial,sans-serif;font-size:12px;color:#1a1a1a;background:#fff}
      .page{padding:28px;max-width:820px;margin:0 auto}
      .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #1e3a8a;padding-bottom:14px;margin-bottom:18px}
      .co-name{font-size:22px;font-weight:900;color:#1e3a8a;letter-spacing:-0.5px}
      .co-sub{font-size:10px;color:#64748b;margin-top:2px}
      .bill-ref{text-align:right}
      .bill-ref h2{font-size:17px;font-weight:800;color:#1e3a8a}
      .bill-ref p{font-size:10px;color:#64748b;margin-top:2px}
      .badge{display:inline-block;padding:2px 10px;border-radius:20px;font-size:10px;font-weight:700;margin-top:4px}
      .badge-paid{background:#dcfce7;color:#166534}
      .badge-partial{background:#fef9c3;color:#854d0e}
      .badge-unpaid{background:#fee2e2;color:#991b1b}
      .grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px}
      .box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:10px}
      .box-title{font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.8px;color:#64748b;border-bottom:1px solid #e2e8f0;padding-bottom:5px;margin-bottom:7px}
      .row{display:flex;justify-content:space-between;margin-bottom:3px}
      .lbl{font-size:10px;color:#64748b}
      .val{font-size:10px;font-weight:600}
      .uhid-val{font-size:13px;font-weight:800;color:#1e3a8a;font-family:monospace}
      .section-title{font-size:10px;font-weight:800;text-transform:uppercase;color:#1e3a8a;background:#eff6ff;padding:5px 10px;margin-bottom:0;border-radius:4px 4px 0 0;border:1px solid #bfdbfe}
      table{width:100%;border-collapse:collapse;margin-bottom:12px}
      th{background:#1e3a8a;color:#fff;padding:6px 10px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.4px}
      th:last-child,td:last-child{text-align:right}
      td{padding:5px 10px;border-bottom:1px solid #e2e8f0;font-size:11px}
      .subtotal-row td{background:#f1f5f9;font-weight:700;border-top:1px solid #cbd5e1}
      .total-row td{background:#1e3a8a;color:#fff;font-weight:900;font-size:13px;border-top:2px solid #1e3a8a}
      .amounts{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:14px}
      .amt-box{border-radius:6px;padding:10px;border:1px solid}
      .amt-box h3{font-size:9px;text-transform:uppercase;font-weight:700;margin-bottom:4px}
      .amt-val{font-size:18px;font-weight:900}
      .green-box{background:#f0fdf4;border-color:#bbf7d0}
      .green-val{color:#16a34a}
      .orange-box{background:#fff7ed;border-color:#fed7aa}
      .orange-val{color:#ea580c}
      .blue-box{background:#eff6ff;border-color:#bfdbfe}
      .blue-val{color:#1e3a8a}
      .footer{margin-top:20px;padding-top:10px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:flex-end;font-size:10px;color:#94a3b8}
      .sig{border-top:1px solid #94a3b8;width:150px;text-align:center;padding-top:4px;font-size:9px;color:#64748b}
      .mode-badge{display:inline-block;padding:1px 7px;border-radius:10px;font-size:9px;font-weight:700}
      @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
    </style></head><body><div class="page">${content}</div></body></html>`);
    win.document.close();
    setTimeout(() => { win.focus(); win.print(); }, 500);
  };

  const modeBg: Record<string,string> = {
    Cash:'#dcfce7;color:#166534',Card:'#ede9fe;color:#6d28d9',
    UPI:'#e0e7ff;color:#4338ca',Cheque:'#fff7ed;color:#c2410c',Insurance:'#cffafe;color:#0e7490'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-slate-50 rounded-t-2xl flex-shrink-0">
          <div><h2 className="font-bold text-slate-800">Print Preview</h2><p className="text-xs text-slate-400 font-mono">{bill.bill_number}</p></div>
          <div className="flex gap-2">
            <Button onClick={handlePrint} className="bg-blue-700 hover:bg-blue-800 gap-2"><Printer className="w-4 h-4"/>Print Bill</Button>
            <Button variant="outline" size="sm" onClick={onClose}><X className="w-4 h-4"/></Button>
          </div>
        </div>
        <div className="overflow-y-auto flex-1 p-6 bg-white">
          <div ref={printRef}>
            {/* Header */}
            <div className="header" style={{display:'flex',justifyContent:'space-between',borderBottom:'3px solid #1e3a8a',paddingBottom:'14px',marginBottom:'18px'}}>
              <div>
                <div style={{fontSize:'22px',fontWeight:'900',color:'#1e3a8a'}}>NItsat MedTech</div>
                <div style={{fontSize:'10px',color:'#64748b',marginTop:'2px'}}>Advanced Healthcare Solutions · Est. 2020</div>
                <div style={{fontSize:'9px',color:'#94a3b8',marginTop:'1px'}}>📍 Hospital Campus, Medical District · ☎ +91-XXXX-XXXX</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:'17px',fontWeight:'800',color:'#1e3a8a'}}>PATIENT BILL</div>
                <div style={{fontSize:'11px',fontFamily:'monospace',color:'#64748b',marginTop:'2px'}}>{bill.bill_number}</div>
                <div style={{fontSize:'10px',color:'#64748b'}}>Date: {bill.bill_date}</div>
                <span style={{display:'inline-block',padding:'2px 10px',borderRadius:'20px',fontSize:'10px',fontWeight:'700',marginTop:'4px',
                  background:bill.status==='Paid'?'#dcfce7':bill.status==='Partial'?'#fef9c3':'#fee2e2',
                  color:bill.status==='Paid'?'#166534':bill.status==='Partial'?'#854d0e':'#991b1b'}}>
                  {bill.status}
                </span>
              </div>
            </div>

            {/* Patient + Admission */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px',marginBottom:'14px'}}>
              <div style={{background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:'6px',padding:'10px'}}>
                <div style={{fontSize:'9px',fontWeight:'800',textTransform:'uppercase',letterSpacing:'.8px',color:'#64748b',borderBottom:'1px solid #e2e8f0',paddingBottom:'5px',marginBottom:'7px'}}>Patient Details</div>
                {[
                  ['UHID', <span style={{fontSize:'13px',fontWeight:'800',color:'#1e3a8a',fontFamily:'monospace'}}>{patient.uhid}</span>],
                  ['Name', `${patient.first_name} ${patient.last_name||''}`],
                  patient.gender && ['Gender', patient.gender],
                  patient.date_of_birth && ['Date of Birth', patient.date_of_birth],
                  patient.blood_group && ['Blood Group', <span style={{fontWeight:'800',color:'#dc2626'}}>{patient.blood_group}</span>],
                  patient.phone && ['Phone', patient.phone],
                  patient.email && ['Email', patient.email],
                  (patient.city||patient.address) && ['Address', [patient.address, patient.city, patient.state].filter(Boolean).join(', ')],
                ].filter(Boolean).map(([label, value]: any, i) => (
                  <div key={i} style={{display:'flex',justifyContent:'space-between',marginBottom:'3px'}}>
                    <span style={{fontSize:'10px',color:'#64748b'}}>{label}</span>
                    <span style={{fontSize:'10px',fontWeight:'600',textAlign:'right',maxWidth:'55%'}}>{value}</span>
                  </div>
                ))}
              </div>
              <div style={{background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:'6px',padding:'10px'}}>
                <div style={{fontSize:'9px',fontWeight:'800',textTransform:'uppercase',letterSpacing:'.8px',color:'#64748b',borderBottom:'1px solid #e2e8f0',paddingBottom:'5px',marginBottom:'7px'}}>Admission Details</div>
                {[
                  ['Type', <span style={{background:'#dbeafe',color:'#1e40af',padding:'1px 7px',borderRadius:'10px',fontSize:'10px',fontWeight:'700'}}>{registration.registration_type}</span>],
                  ['Admitted', `${registration.admission_date}${registration.admission_time?' at '+registration.admission_time:''}`],
                  registration.discharge_date && ['Discharged', registration.discharge_date],
                  ['Status', registration.status],
                  dept && ['Department', dept.name],
                  registration.room_type && ['Room', registration.room_type],
                  registration.provisional_diagnosis && ['Diagnosis', registration.provisional_diagnosis],
                  registration.procedure_treatment && ['Treatment', registration.procedure_treatment],
                  registration.guardian_name && ['Guardian', `${registration.guardian_name} (${registration.guardian_relation||''})`],
                  registration.insurance_company && ['Insurance', registration.insurance_company],
                ].filter(Boolean).map(([label, value]: any, i) => (
                  <div key={i} style={{display:'flex',justifyContent:'space-between',marginBottom:'3px'}}>
                    <span style={{fontSize:'10px',color:'#64748b'}}>{label}</span>
                    <span style={{fontSize:'10px',fontWeight:'600',textAlign:'right',maxWidth:'55%'}}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Items by category */}
            {CATEGORIES.map(cat => {
              const catItems = groupedItems[cat.key] || [];
              if (!catItems.length) return null;
              return (
                <div key={cat.key} style={{marginBottom:'12px'}}>
                  <div style={{fontSize:'10px',fontWeight:'800',textTransform:'uppercase',color:'#1e3a8a',background:'#eff6ff',padding:'5px 10px',borderRadius:'4px 4px 0 0',border:'1px solid #bfdbfe',borderBottom:'none'}}>
                    {cat.icon} {cat.label}
                  </div>
                  <table style={{width:'100%',borderCollapse:'collapse',border:'1px solid #bfdbfe'}}>
                    <thead>
                      <tr>
                        {['Item / Name','Description','Qty','Unit','Rate (₹)','Amount (₹)'].map((h,i)=>(
                          <th key={h} style={{background:'#1e3a8a',color:'#fff',padding:'5px 8px',textAlign:i>=2?'right':'left',fontSize:'9px',textTransform:'uppercase'}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {catItems.map((item, i) => (
                        <tr key={item.id} style={{background:i%2===0?'#fff':'#f8fafc'}}>
                          <td style={{padding:'5px 8px',fontSize:'11px',fontWeight:'600'}}>{item.name}</td>
                          <td style={{padding:'5px 8px',fontSize:'10px',color:'#64748b'}}>
                            {item.description||''}
                            {item.batch_number && <span style={{display:'block',fontSize:'9px',color:'#94a3b8'}}>Batch: {item.batch_number}{item.expiry_date?` · Exp: ${item.expiry_date}`:''}</span>}
                          </td>
                          <td style={{padding:'5px 8px',textAlign:'right',fontSize:'11px'}}>{item.quantity}</td>
                          <td style={{padding:'5px 8px',textAlign:'right',fontSize:'11px'}}>{item.unit||'—'}</td>
                          <td style={{padding:'5px 8px',textAlign:'right',fontSize:'11px'}}>₹{item.rate.toFixed(2)}</td>
                          <td style={{padding:'5px 8px',textAlign:'right',fontSize:'11px',fontWeight:'700'}}>₹{item.amount.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}

            {/* Summary Table */}
            <table style={{width:'100%',borderCollapse:'collapse',marginBottom:'14px'}}>
              <thead><tr>
                <th style={{background:'#1e3a8a',color:'#fff',padding:'7px 10px',textAlign:'left',fontSize:'10px'}}>Charge Category</th>
                <th style={{background:'#1e3a8a',color:'#fff',padding:'7px 10px',textAlign:'right',fontSize:'10px'}}>Amount</th>
              </tr></thead>
              <tbody>
                {bill.total_medicine_amount>0&&<tr><td style={{padding:'5px 10px',borderBottom:'1px solid #e2e8f0',fontSize:'11px'}}>💊 Medicine / Pharmacy</td><td style={{padding:'5px 10px',textAlign:'right',fontWeight:'600',fontSize:'11px'}}>₹{bill.total_medicine_amount.toFixed(2)}</td></tr>}
                {bill.total_investigation_amount>0&&<tr><td style={{padding:'5px 10px',borderBottom:'1px solid #e2e8f0',fontSize:'11px'}}>🔬 Lab / Investigation</td><td style={{padding:'5px 10px',textAlign:'right',fontWeight:'600',fontSize:'11px'}}>₹{bill.total_investigation_amount.toFixed(2)}</td></tr>}
                {bill.total_bed_amount>0&&<tr><td style={{padding:'5px 10px',borderBottom:'1px solid #e2e8f0',fontSize:'11px'}}>🛏️ Bed / Room Charges</td><td style={{padding:'5px 10px',textAlign:'right',fontWeight:'600',fontSize:'11px'}}>₹{bill.total_bed_amount.toFixed(2)}</td></tr>}
                {bill.total_doctor_amount>0&&<tr><td style={{padding:'5px 10px',borderBottom:'1px solid #e2e8f0',fontSize:'11px'}}>👨‍⚕️ Doctor / Consultation</td><td style={{padding:'5px 10px',textAlign:'right',fontWeight:'600',fontSize:'11px'}}>₹{bill.total_doctor_amount.toFixed(2)}</td></tr>}
                {bill.total_other_amount>0&&<tr><td style={{padding:'5px 10px',borderBottom:'1px solid #e2e8f0',fontSize:'11px'}}>📋 Other Charges</td><td style={{padding:'5px 10px',textAlign:'right',fontWeight:'600',fontSize:'11px'}}>₹{bill.total_other_amount.toFixed(2)}</td></tr>}
                <tr><td style={{padding:'6px 10px',background:'#f1f5f9',fontWeight:'700',borderTop:'1px solid #cbd5e1',fontSize:'12px'}}>Subtotal</td><td style={{padding:'6px 10px',textAlign:'right',background:'#f1f5f9',fontWeight:'700',fontSize:'12px'}}>₹{(bill.subtotal||bill.total_amount).toFixed(2)}</td></tr>
                {(bill.gst_percent||0)>0&&<tr><td style={{padding:'5px 10px',borderBottom:'1px solid #e2e8f0',fontSize:'11px'}}>GST ({bill.gst_percent}%)</td><td style={{padding:'5px 10px',textAlign:'right',fontWeight:'600',fontSize:'11px'}}>₹{(bill.gst_amount||0).toFixed(2)}</td></tr>}
                <tr><td style={{padding:'8px 10px',background:'#1e3a8a',color:'#fff',fontWeight:'900',fontSize:'14px'}}>TOTAL AMOUNT</td><td style={{padding:'8px 10px',textAlign:'right',background:'#1e3a8a',color:'#fff',fontWeight:'900',fontSize:'16px'}}>₹{bill.total_amount.toFixed(2)}</td></tr>
              </tbody>
            </table>

            {/* Amounts row */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'10px',marginBottom:'14px'}}>
              <div style={{background:'#eff6ff',border:'1px solid #bfdbfe',borderRadius:'6px',padding:'10px'}}>
                <div style={{fontSize:'9px',fontWeight:'700',textTransform:'uppercase',color:'#1e3a8a',marginBottom:'4px'}}>Total Bill</div>
                <div style={{fontSize:'18px',fontWeight:'900',color:'#1e3a8a'}}>₹{bill.total_amount.toFixed(2)}</div>
              </div>
              <div style={{background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:'6px',padding:'10px'}}>
                <div style={{fontSize:'9px',fontWeight:'700',textTransform:'uppercase',color:'#166534',marginBottom:'4px'}}>Amount Paid</div>
                <div style={{fontSize:'18px',fontWeight:'900',color:'#16a34a'}}>₹{bill.deposit_paid.toFixed(2)}</div>
              </div>
              <div style={{background:bill.amount_due===0?'#f0fdf4':'#fff7ed',border:`1px solid ${bill.amount_due===0?'#bbf7d0':'#fed7aa'}`,borderRadius:'6px',padding:'10px'}}>
                <div style={{fontSize:'9px',fontWeight:'700',textTransform:'uppercase',color:bill.amount_due===0?'#166534':'#c2410c',marginBottom:'4px'}}>Amount Due</div>
                <div style={{fontSize:'18px',fontWeight:'900',color:bill.amount_due===0?'#16a34a':'#ea580c'}}>₹{bill.amount_due.toFixed(2)}</div>
              </div>
            </div>

            {/* Payment History */}
            {payments.length>0&&(
              <div style={{marginBottom:'14px'}}>
                <div style={{fontSize:'10px',fontWeight:'800',textTransform:'uppercase',color:'#1e3a8a',marginBottom:'6px'}}>Payment History</div>
                <table style={{width:'100%',borderCollapse:'collapse'}}>
                  <thead><tr>
                    {['#','Date','Mode','Reference','Amount'].map((h,i)=>(
                      <th key={h} style={{background:'#1e3a8a',color:'#fff',padding:'5px 8px',textAlign:i===4?'right':'left',fontSize:'9px',textTransform:'uppercase'}}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {payments.map((p,i)=>(
                      <tr key={p.id} style={{background:i%2===0?'#fff':'#f8fafc'}}>
                        <td style={{padding:'4px 8px',fontSize:'10px',color:'#64748b'}}>{i+1}</td>
                        <td style={{padding:'4px 8px',fontSize:'10px'}}>{p.payment_date}</td>
                        <td style={{padding:'4px 8px'}}>
                          <span style={{display:'inline-block',padding:'1px 7px',borderRadius:'10px',fontSize:'9px',fontWeight:'700',background:p.payment_mode==='Cash'?'#dcfce7':p.payment_mode==='Card'?'#ede9fe':p.payment_mode==='UPI'?'#e0e7ff':'#fff7ed',color:p.payment_mode==='Cash'?'#166534':p.payment_mode==='Card'?'#6d28d9':p.payment_mode==='UPI'?'#4338ca':'#c2410c'}}>
                            {p.payment_mode}
                          </span>
                        </td>
                        <td style={{padding:'4px 8px',fontSize:'10px',fontFamily:'monospace',color:'#64748b'}}>{p.reference_number||'—'}</td>
                        <td style={{padding:'4px 8px',textAlign:'right',fontSize:'11px',fontWeight:'700',color:'#16a34a'}}>₹{p.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                    <tr>
                      <td colSpan={4} style={{padding:'5px 8px',fontWeight:'700',textAlign:'right',background:'#f0fdf4',fontSize:'11px'}}>Total Collected</td>
                      <td style={{padding:'5px 8px',textAlign:'right',fontWeight:'900',fontSize:'13px',color:'#16a34a',background:'#f0fdf4'}}>₹{totalPaid.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Footer */}
            <div style={{marginTop:'20px',paddingTop:'10px',borderTop:'1px solid #e2e8f0',display:'flex',justifyContent:'space-between',alignItems:'flex-end',fontSize:'9px',color:'#94a3b8'}}>
              <div>
                <div>Generated: {new Date().toLocaleString()}</div>
                <div>Bill: {bill.id} · Patient: {patient.id} · Reg: {registration.id}</div>
                <div style={{marginTop:'3px',fontWeight:'600',color:'#64748b'}}>NItsat MedTech — Advanced Healthcare Solutions</div>
              </div>
              <div style={{borderTop:'1px solid #94a3b8',width:'150px',textAlign:'center',paddingTop:'4px',fontSize:'9px',color:'#64748b'}}>Authorized Signature</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Add / Edit Item Form ──────────────────────────────────────────────────
function ItemForm({ billId, editItem, onSaved, onCancel }:
  { billId: number; editItem?: BillItem; onSaved: (bill: Bill, item: BillItem) => void; onCancel: () => void }) {
  const [form, setForm] = useState({
    category: editItem?.category || 'medicine',
    name: editItem?.name || '',
    description: editItem?.description || '',
    quantity: String(editItem?.quantity || 1),
    unit: editItem?.unit || '',
    rate: String(editItem?.rate || ''),
    batch_number: editItem?.batch_number || '',
    expiry_date: editItem?.expiry_date || '',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const amount = parseFloat(form.quantity || '0') * parseFloat(form.rate || '0');

  const handleSave = async () => {
    if (!form.name || !form.rate) { setErr('Name and Rate are required'); return; }
    setSaving(true); setErr('');
    try {
      const body = editItem
        ? { action: 'edit-item', item_id: editItem.id, ...form, quantity: parseFloat(form.quantity), rate: parseFloat(form.rate) }
        : { action: 'add-item', bill_id: billId, ...form, quantity: parseFloat(form.quantity), rate: parseFloat(form.rate) };
      const res = await fetch('/api/billing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || 'Failed to save'); return; }
      onSaved(data.bill, data.item);
    } catch { setErr('Error saving item'); } finally { setSaving(false); }
  };

  const showMedFields = form.category === 'medicine';
  const cat = catInfo(form.category);

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-sm text-slate-700">{editItem ? 'Edit Item' : 'Add New Item'}</h4>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4"/></button>
      </div>

      {/* Category */}
      <div>
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Category *</label>
        <div className="grid grid-cols-5 gap-1.5 mt-1">
          {CATEGORIES.map(c => (
            <button key={c.key} type="button" onClick={() => setForm(f=>({...f,category:c.key}))}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs font-semibold transition-all ${form.category===c.key?'border-blue-500 bg-blue-50 text-blue-700':'border-slate-200 hover:border-slate-300 text-slate-600'}`}>
              <span className="text-base">{c.icon}</span>
              <span className="text-center leading-tight" style={{fontSize:'9px'}}>{c.label.split('/')[0].trim()}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 md:col-span-1">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Item Name *</label>
          <Input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Paracetamol 500mg" className="mt-1"/>
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Description</label>
          <Input value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Optional notes" className="mt-1"/>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Qty *</label>
          <Input type="number" min="0.01" step="any" value={form.quantity} onChange={e=>setForm(f=>({...f,quantity:e.target.value}))} className="mt-1"/>
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Unit</label>
          <Input value={form.unit} onChange={e=>setForm(f=>({...f,unit:e.target.value}))} placeholder="Tab/Strip/ml" className="mt-1"/>
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Rate (₹) *</label>
          <Input type="number" min="0" step="any" value={form.rate} onChange={e=>setForm(f=>({...f,rate:e.target.value}))} className="mt-1"/>
        </div>
        <div className="flex flex-col justify-end">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Amount</label>
          <div className="mt-1 h-10 flex items-center px-3 bg-blue-50 border border-blue-200 rounded-md font-bold text-blue-700">
            ₹{isNaN(amount) ? '0.00' : amount.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Medicine-specific fields */}
      {showMedFields && (
        <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-200">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Batch Number</label>
            <Input value={form.batch_number} onChange={e=>setForm(f=>({...f,batch_number:e.target.value}))} placeholder="e.g. BT2024001" className="mt-1"/>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Expiry Date</label>
            <Input type="date" value={form.expiry_date} onChange={e=>setForm(f=>({...f,expiry_date:e.target.value}))} className="mt-1"/>
          </div>
        </div>
      )}

      {err && <p className="text-red-500 text-xs">{err}</p>}

      <div className="flex gap-2 pt-1">
        <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
          <Save className="w-3.5 h-3.5"/>{saving ? 'Saving...' : editItem ? 'Update Item' : 'Add Item'}
        </Button>
        <Button variant="outline" onClick={onCancel} size="sm">Cancel</Button>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────
function BillingContent() {
  const sp = useSearchParams();
  const router = useRouter();
  const regIdParam = sp.get('registrationId');
  const uhidParam = sp.get('uhid');
  const autoPrintParam = sp.get('autoPrint');

  const [recentPatients, setRecentPatients] = useState<Patient[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState(uhidParam || '');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [showResults, setShowResults] = useState(false);

  const [patient, setPatient] = useState<Patient | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [selectedRegId, setSelectedRegId] = useState<number | null>(regIdParam ? parseInt(regIdParam) : null);
  const [bill, setBill] = useState<Bill | null>(null);
  const [items, setItems] = useState<BillItem[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Item form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [editItem, setEditItem] = useState<BillItem | undefined>(undefined);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Payment form
  const [payForm, setPayForm] = useState({ amount: '', payment_mode: 'Cash', reference_number: '' });
  const [showPayForm, setShowPayForm] = useState(false);

  // Print modal
  const [showPrint, setShowPrint] = useState(false);

  // GST
  const [gstPercent, setGstPercent] = useState('0');
  const [editGst, setEditGst] = useState(false);

  // Create bill prompt
  const [createDeposit, setCreateDeposit] = useState('');
  const [showCreateBill, setShowCreateBill] = useState(false);

  // Load recent + departments on mount
  useEffect(() => {
    fetch('/api/patients').then(r=>r.json()).then(d=>setRecentPatients(Array.isArray(d)?d.slice(0,10):[])).catch(()=>{});
    fetch('/api/departments').then(r=>r.json()).then(d=>setDepartments(Array.isArray(d)?d:[])).catch(()=>{});
    if (uhidParam) fetch(`/api/patients?search=${encodeURIComponent(uhidParam)}`).then(r=>r.json()).then(d=>{if(d.length>0)selectPatient(d[0]);}).catch(()=>{});
    else if (regIdParam) loadRegistrationContext(parseInt(regIdParam));
  }, []);


  const loadRegistrationContext = async (regId: number) => {
    try {
      const res = await fetch(`/api/registrations?registrationId=${regId}&limit=1`);
      if (res.ok) {
        const regs: Registration[] = await res.json();
        if (regs.length > 0) {
          const reg = regs[0] as Registration & any;
          setRegistrations(regs);
          setSelectedRegId(reg.id);
          setPatient({
            id: reg.patient_id,
            uhid: reg.uhid,
            first_name: reg.first_name,
            last_name: reg.last_name,
            phone: reg.phone,
            gender: reg.gender,
            date_of_birth: reg.date_of_birth,
            address: reg.address,
            city: reg.city,
            state: reg.state,
            blood_group: reg.blood_group,
            created_at: reg.created_at,
          });
        }
      }
    } catch {}

    await loadBill(regId);
  };

  const selectPatient = async (p: Patient) => {
    setPatient(p); setSearchTerm(''); setShowResults(false); setSearchResults([]);
    setBill(null); setItems([]); setPayments([]); setSelectedRegId(null); setError('');
    try {
      const res = await fetch(`/api/registrations?patientId=${p.id}`);
      if (res.ok) {
        const regs: Registration[] = await res.json();
        setRegistrations(regs);
        if (regs.length > 0) { setSelectedRegId(regs[0].id); loadBill(regs[0].id); }
      }
    } catch {}
  };

  const loadBill = async (regId: number) => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`/api/billing?registrationId=${regId}`);
      if (res.ok) {
        const bills: Bill[] = await res.json();
        if (bills.length > 0) {
          await loadFullBill(bills[0].id);
        } else {
          setBill(null); setItems([]); setPayments([]);
          setShowCreateBill(true);
        }
      }
    } catch {} finally { setLoading(false); }
  };

  const loadFullBill = async (billId: number) => {
    const res = await fetch(`/api/billing?billId=${billId}`);
    if (res.ok) {
      const data = await res.json();
      setBill(data.bill); setItems(data.items || []); setPayments(data.payments || []);
      setGstPercent(String(data.bill.gst_percent || 0));
      setShowCreateBill(false);
      if (autoPrintParam === '1' && data.bill?.status === 'Paid') {
        setShowPrint(true);
      }
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    setSearching(true); setShowResults(true);
    try { const res=await fetch(`/api/patients?search=${encodeURIComponent(searchTerm)}`); if(res.ok) setSearchResults(await res.json()); }
    catch {} finally { setSearching(false); }
  };

  const filteredRecent = searchTerm
    ? recentPatients.filter(p => p.uhid.toLowerCase().includes(searchTerm.toLowerCase())||p.first_name.toLowerCase().includes(searchTerm.toLowerCase())||(p.last_name||'').toLowerCase().includes(searchTerm.toLowerCase())||(p.phone||'').includes(searchTerm))
    : recentPatients;

  const handleCreateBill = async () => {
    if (!selectedRegId) return;
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/billing', { method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ action:'create-bill', registration_id: selectedRegId, initial_deposit: parseFloat(createDeposit)||0, gst_percent: parseFloat(gstPercent)||0 }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error||'Failed'); return; }
      await loadFullBill(data.id);
      setSuccess('Bill created!'); setTimeout(()=>setSuccess(''),3000);
    } catch { setError('Error'); } finally { setLoading(false); }
  };

  const handleItemSaved = (updatedBill: Bill, updatedItem: BillItem) => {
    setBill(updatedBill);
    setItems(prev => {
      const exists = prev.find(i => i.id === updatedItem.id);
      return exists ? prev.map(i => i.id===updatedItem.id ? updatedItem : i) : [...prev, updatedItem];
    });
    setShowAddForm(false); setEditItem(undefined);
    setSuccess('Item saved!'); setTimeout(()=>setSuccess(''),3000);
  };

  const handleDeleteItem = async (itemId: number) => {
    if (!confirm('Delete this item?')) return;
    setDeletingId(itemId);
    try {
      const res = await fetch('/api/billing', { method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ action:'delete-item', item_id: itemId }) });
      const data = await res.json();
      if (res.ok) { setBill(data.bill); setItems(prev=>prev.filter(i=>i.id!==itemId)); }
    } catch {} finally { setDeletingId(null); }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault(); if (!bill) return;
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/billing', { method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ action:'add-payment', bill_id:bill.id, amount:parseFloat(payForm.amount), payment_mode:payForm.payment_mode, reference_number:payForm.reference_number||undefined }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error||'Failed'); return; }
      setBill(data.bill);
      setPayments(prev=>[...prev, data.payment]);
      setPayForm({amount:'',payment_mode:'Cash',reference_number:''});
      setShowPayForm(false);
      setSuccess('Payment recorded!'); setTimeout(()=>setSuccess(''),3000);
      if (autoPrintParam === '1' && data.bill?.status === 'Paid') setShowPrint(true);
    } catch { setError('Error'); } finally { setLoading(false); }
  };

  const handleUpdateGst = async () => {
    if (!bill) return;
    const res = await fetch('/api/billing', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ action:'update-gst', bill_id:bill.id, gst_percent:parseFloat(gstPercent)||0 }) });
    const data = await res.json();
    if (res.ok) { setBill(data.bill); setEditGst(false); }
  };

  const groupedItems = CATEGORIES.reduce((acc, cat) => {
    acc[cat.key] = items.filter(i => i.category === cat.key);
    return acc;
  }, {} as Record<string, BillItem[]>);

  const selectedReg = registrations.find(r => r.id === selectedRegId);
  const totalPaid = payments.reduce((s,p)=>s+p.amount,0);
  const paidPct = bill ? Math.min(100,(bill.deposit_paid/(bill.total_amount||1))*100) : 0;

  return (
    <>
      {showPrint && bill && patient && selectedReg && (
        <PrintModal patient={patient} registration={selectedReg} bill={bill} items={items} payments={payments} departments={departments} onClose={()=>setShowPrint(false)}/>
      )}

      <div className="min-h-screen bg-slate-100">
        {/* Header */}
        <header className="bg-white border-b shadow-sm sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={()=>router.push('/dashboard')} className="p-0"><ArrowLeft className="w-5 h-5"/></Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center"><Receipt className="w-4 h-4 text-white"/></div>
              <div><p className="font-bold text-slate-800 leading-none">Billing</p><p className="text-xs text-slate-400">NItsat MedTech</p></div>
            </div>
            {patient && (
              <div className="ml-auto flex items-center gap-2 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg">
                <span className="text-xs font-bold text-blue-700 font-mono">{patient.uhid}</span>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs text-slate-600 font-medium">{patient.first_name} {patient.last_name||''}</span>
                <button onClick={()=>{setPatient(null);setBill(null);setItems([]);setPayments([]);}} className="ml-1 text-slate-400 hover:text-slate-600"><X className="w-3.5 h-3.5"/></button>
              </div>
            )}
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 py-5 grid grid-cols-1 lg:grid-cols-4 gap-5">
          {/* ── Sidebar ── */}
          <div className="space-y-4">
            <Card className="p-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Find Patient</p>
              <form onSubmit={handleSearch} className="flex gap-2">
                <Input value={searchTerm} onChange={e=>{setSearchTerm(e.target.value);setShowResults(false);}} placeholder="UHID, name, phone..." className="text-sm h-8 flex-1"/>
                <Button type="submit" size="sm" className="h-8 px-3 bg-blue-700 hover:bg-blue-800"><Search className="w-3.5 h-3.5"/></Button>
              </form>
              {showResults && (
                <div className="mt-2 border rounded-lg overflow-hidden">
                  {searching ? <p className="text-xs text-slate-400 p-3 text-center">Searching...</p>
                  : searchResults.length===0 ? <p className="text-xs text-slate-400 p-3 text-center">No results</p>
                  : searchResults.map(p=>(
                    <button key={p.id} onClick={()=>selectPatient(p)} className="w-full text-left px-3 py-2 hover:bg-slate-50 border-b last:border-0">
                      <p className="text-sm font-semibold">{p.first_name} {p.last_name||''}</p>
                      <p className="text-xs font-mono text-blue-600">{p.uhid}</p>
                    </button>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5"/>Recent Patients</p>
              {filteredRecent.length===0 ? <p className="text-xs text-slate-400 text-center py-3">No patients yet</p>
              : <div className="space-y-1.5">
                {filteredRecent.map(p=>(
                  <button key={p.id} onClick={()=>selectPatient(p)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all ${patient?.id===p.id?'border-blue-400 bg-blue-50':'border-slate-200 hover:border-blue-300 hover:bg-slate-50'}`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${patient?.id===p.id?'bg-blue-600 text-white':'bg-slate-200 text-slate-600'}`}>
                        {p.first_name[0]}{(p.last_name||'')[0]||''}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{p.first_name} {p.last_name||''}</p>
                        <div className="flex gap-2"><span className="text-xs font-mono text-blue-600">{p.uhid}</span>{p.blood_group&&<span className="text-xs text-red-500 font-bold">{p.blood_group}</span>}</div>
                      </div>
                      {patient?.id===p.id&&<div className="w-2 h-2 rounded-full bg-blue-600 ml-auto flex-shrink-0"/>}
                    </div>
                    {p.phone&&<p className="text-xs text-slate-400 pl-9 mt-0.5">{p.phone}</p>}
                  </button>
                ))}
              </div>}
            </Card>
          </div>

          {/* ── Main ── */}
          <div className="lg:col-span-3 space-y-4">
            {!patient ? (
              <Card className="p-16 text-center"><Receipt className="w-12 h-12 text-blue-200 mx-auto mb-3"/><h3 className="text-lg font-bold text-slate-600 mb-1">Select a Patient</h3><p className="text-sm text-slate-400">Search or click from recent patients to manage billing</p></Card>
            ) : (
              <>
                {/* Patient Banner */}
                <Card className="p-5 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-blue-700 rounded-xl flex items-center justify-center text-white text-xl font-black flex-shrink-0">
                      {patient.first_name[0]}{(patient.last_name||'')[0]||''}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h2 className="text-xl font-black text-slate-800">{patient.first_name} {patient.last_name||''}</h2>
                          <div className="flex flex-wrap gap-2 mt-1">
                            <span className="font-mono font-bold text-blue-700 bg-blue-100 border border-blue-200 px-2 py-0.5 rounded text-sm">{patient.uhid}</span>
                            {patient.gender&&<span className="text-xs bg-white border text-slate-600 px-2 py-0.5 rounded">{patient.gender}</span>}
                            {patient.blood_group&&<span className="text-xs font-bold text-red-700 bg-red-100 border border-red-200 px-2 py-0.5 rounded flex items-center gap-1"><Droplets className="w-3 h-3"/>{patient.blood_group}</span>}
                          </div>
                          <div className="flex flex-wrap gap-3 mt-2">
                            {patient.phone&&<span className="text-xs text-slate-500 flex items-center gap-1"><Phone className="w-3 h-3"/>{patient.phone}</span>}
                            {patient.date_of_birth&&<span className="text-xs text-slate-500 flex items-center gap-1"><Calendar className="w-3 h-3"/>DOB: {patient.date_of_birth}</span>}
                          </div>
                        </div>
                        <button onClick={()=>{setPatient(null);setBill(null);}} className="text-slate-400 hover:text-slate-600 p-1"><X className="w-4 h-4"/></button>
                      </div>
                    </div>
                  </div>
                  {registrations.length>0&&(
                    <div className="mt-4 pt-3 border-t border-blue-200">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Select Visit</p>
                      <div className="flex gap-2 flex-wrap">
                        {registrations.map(reg=>(
                          <button key={reg.id} onClick={()=>{setSelectedRegId(reg.id);loadBill(reg.id);}}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs border font-medium transition-all ${selectedRegId===reg.id?'bg-blue-700 text-white border-blue-700':'bg-white text-slate-700 border-slate-200 hover:border-blue-400'}`}>
                            <span className="font-bold">{reg.registration_type}</span>
                            <span className="opacity-80">{reg.admission_date}</span>
                            <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${selectedRegId===reg.id?'bg-white/20 text-white':STATUS_COLORS[reg.status]}`}>{reg.status}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>

                {success&&<div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-2 rounded-lg"><CheckCircle className="w-4 h-4"/>{success}</div>}
                {error&&<div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2 rounded-lg">{error}</div>}

                {/* Create Bill prompt */}
                {showCreateBill && !bill && (
                  <Card className="p-6 border-dashed border-2 border-blue-200 bg-blue-50/50 text-center">
                    <Receipt className="w-10 h-10 text-blue-300 mx-auto mb-3"/>
                    <h3 className="font-bold text-slate-700 mb-1">No bill yet for this visit</h3>
                    <p className="text-sm text-slate-500 mb-4">Create a bill to start adding charges. You can collect an initial deposit now.</p>
                    <div className="flex items-center gap-3 max-w-xs mx-auto mb-4">
                      <div className="flex-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Initial Deposit (₹)</label>
                        <Input type="number" min="0" value={createDeposit} onChange={e=>setCreateDeposit(e.target.value)} placeholder="0.00" className="mt-1"/>
                      </div>
                      <div className="flex-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">GST %</label>
                        <Input type="number" min="0" max="100" value={gstPercent} onChange={e=>setGstPercent(e.target.value)} placeholder="0" className="mt-1"/>
                      </div>
                    </div>
                    <Button onClick={handleCreateBill} disabled={loading} className="bg-blue-700 hover:bg-blue-800 text-white">
                      <Plus className="w-4 h-4 mr-2"/>Create Bill
                    </Button>
                  </Card>
                )}

                {/* ── Bill Section ── */}
                {bill && (
                  <div className="space-y-4">
                    {/* Bill Header */}
                    <Card className="p-5">
                      <div className="flex items-start justify-between flex-wrap gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-blue-700 text-lg">{bill.bill_number}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${STATUS_COLORS[bill.status]}`}>{bill.status}</span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">Date: {bill.bill_date}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={()=>setShowPrint(true)} className="gap-1.5">
                            <Printer className="w-3.5 h-3.5"/>Print
                          </Button>
                          <Button size="sm" onClick={()=>{setShowAddForm(true);setEditItem(undefined);}} className="bg-blue-700 hover:bg-blue-800 text-white gap-1.5">
                            <Plus className="w-3.5 h-3.5"/>Add Charge
                          </Button>
                        </div>
                      </div>

                      {/* GST Control */}
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                        <span className="text-xs text-slate-500 font-medium">GST:</span>
                        {editGst ? (
                          <>
                            <Input type="number" min="0" max="100" value={gstPercent} onChange={e=>setGstPercent(e.target.value)} className="w-20 h-7 text-sm"/>
                            <span className="text-xs text-slate-400">%</span>
                            <Button size="sm" onClick={handleUpdateGst} className="h-7 px-2 bg-blue-700 text-white">Apply</Button>
                            <Button size="sm" variant="ghost" onClick={()=>setEditGst(false)} className="h-7 px-2">Cancel</Button>
                          </>
                        ) : (
                          <>
                            <span className="text-sm font-bold text-slate-700">{bill.gst_percent||0}%</span>
                            <Button size="sm" variant="ghost" onClick={()=>setEditGst(true)} className="h-6 px-2 text-xs text-slate-500">Edit</Button>
                          </>
                        )}
                      </div>
                    </Card>

                    {/* Add / Edit form */}
                    {(showAddForm||editItem) && (
                      <ItemForm billId={bill.id} editItem={editItem} onSaved={handleItemSaved} onCancel={()=>{setShowAddForm(false);setEditItem(undefined);}}/>
                    )}

                    {/* Items by Category */}
                    {items.length===0 && !showAddForm && (
                      <Card className="p-8 text-center border-dashed">
                        <p className="text-slate-400 text-sm mb-2">No charges added yet</p>
                        <Button size="sm" onClick={()=>setShowAddForm(true)} className="bg-blue-700 hover:bg-blue-800 text-white gap-1.5"><Plus className="w-3.5 h-3.5"/>Add First Charge</Button>
                      </Card>
                    )}

                    {CATEGORIES.map(cat => {
                      const catItems = groupedItems[cat.key] || [];
                      if (!catItems.length) return null;
                      return (
                        <Card key={cat.key} className="overflow-hidden">
                          <div className={`px-4 py-2.5 flex items-center justify-between border-b ${cat.color}`}>
                            <span className="font-bold text-sm flex items-center gap-2">{cat.icon} {cat.label}</span>
                            <span className="font-bold text-sm">
                              ₹{catItems.reduce((s,i)=>s+i.amount,0).toFixed(2)}
                            </span>
                          </div>
                          <table className="w-full">
                            <thead>
                              <tr className="bg-slate-50 border-b">
                                <th className="px-4 py-2 text-left text-xs font-bold text-slate-400 uppercase">Name</th>
                                <th className="px-4 py-2 text-left text-xs font-bold text-slate-400 uppercase">Details</th>
                                <th className="px-4 py-2 text-right text-xs font-bold text-slate-400 uppercase">Qty</th>
                                <th className="px-4 py-2 text-right text-xs font-bold text-slate-400 uppercase">Rate</th>
                                <th className="px-4 py-2 text-right text-xs font-bold text-slate-400 uppercase">Amount</th>
                                <th className="px-4 py-2 text-center text-xs font-bold text-slate-400 uppercase">Act</th>
                              </tr>
                            </thead>
                            <tbody>
                              {catItems.map(item=>(
                                <tr key={item.id} className="border-b hover:bg-slate-50/60 group">
                                  <td className="px-4 py-3">
                                    <p className="text-sm font-semibold text-slate-800">{item.name}</p>
                                    {item.unit&&<p className="text-xs text-slate-400">{item.unit}</p>}
                                  </td>
                                  <td className="px-4 py-3 text-xs text-slate-500">
                                    {item.description&&<p>{item.description}</p>}
                                    {item.batch_number&&<p className="font-mono text-slate-400">Batch: {item.batch_number}</p>}
                                    {item.expiry_date&&<p className="text-slate-400">Exp: {item.expiry_date}</p>}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-right text-slate-700">{item.quantity}</td>
                                  <td className="px-4 py-3 text-sm text-right text-slate-700">₹{item.rate.toFixed(2)}</td>
                                  <td className="px-4 py-3 text-sm text-right font-bold text-slate-800">₹{item.amount.toFixed(2)}</td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center justify-center gap-1.5">
                                      <button onClick={()=>{setEditItem(item);setShowAddForm(false);}} title="Edit"
                                        className="p-1.5 rounded border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-300 transition-all">
                                        <Pencil className="w-3.5 h-3.5"/>
                                      </button>
                                      <button onClick={()=>handleDeleteItem(item.id)} disabled={deletingId===item.id} title="Delete"
                                        className="p-1.5 rounded border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-300 transition-all">
                                        <Trash2 className="w-3.5 h-3.5"/>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </Card>
                      );
                    })}

                    {/* Totals Summary */}
                    {items.length > 0 && (
                      <Card className="p-5">
                        <h3 className="font-bold text-slate-700 mb-3 text-sm uppercase tracking-wide">Bill Summary</h3>
                        <div className="space-y-2">
                          {bill.total_medicine_amount>0&&<div className="flex justify-between text-sm"><span className="text-slate-500">💊 Medicine / Pharmacy</span><span className="font-semibold">₹{bill.total_medicine_amount.toFixed(2)}</span></div>}
                          {bill.total_investigation_amount>0&&<div className="flex justify-between text-sm"><span className="text-slate-500">🔬 Lab / Investigation</span><span className="font-semibold">₹{bill.total_investigation_amount.toFixed(2)}</span></div>}
                          {bill.total_bed_amount>0&&<div className="flex justify-between text-sm"><span className="text-slate-500">🛏️ Bed / Room</span><span className="font-semibold">₹{bill.total_bed_amount.toFixed(2)}</span></div>}
                          {bill.total_doctor_amount>0&&<div className="flex justify-between text-sm"><span className="text-slate-500">👨‍⚕️ Doctor / Consultation</span><span className="font-semibold">₹{bill.total_doctor_amount.toFixed(2)}</span></div>}
                          {bill.total_other_amount>0&&<div className="flex justify-between text-sm"><span className="text-slate-500">📋 Other</span><span className="font-semibold">₹{bill.total_other_amount.toFixed(2)}</span></div>}
                          <div className="border-t pt-2 flex justify-between font-semibold"><span>Subtotal</span><span>₹{(bill.subtotal||0).toFixed(2)}</span></div>
                          {(bill.gst_percent||0)>0&&<div className="flex justify-between text-sm"><span className="text-slate-500">GST ({bill.gst_percent}%)</span><span className="font-semibold">₹{(bill.gst_amount||0).toFixed(2)}</span></div>}
                          <div className="border-t pt-2 flex justify-between text-lg font-black"><span className="text-blue-700">Total</span><span className="text-blue-700">₹{bill.total_amount.toFixed(2)}</span></div>
                        </div>

                        {bill.total_amount>0&&(
                          <div className="mt-4 space-y-1.5">
                            <div className="flex justify-between text-xs"><span className="text-slate-400">Payment Progress</span><span className="font-bold">{paidPct.toFixed(0)}%</span></div>
                            <div className="w-full bg-slate-200 rounded-full h-2.5"><div className={`h-2.5 rounded-full transition-all ${paidPct>=100?'bg-green-500':'bg-blue-600'}`} style={{width:`${paidPct}%`}}/></div>
                            <div className="grid grid-cols-3 gap-3 mt-3">
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                                <p className="text-xs text-blue-600 font-bold uppercase">Total</p>
                                <p className="font-black text-blue-700 text-lg">₹{bill.total_amount.toFixed(0)}</p>
                              </div>
                              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                                <p className="text-xs text-green-600 font-bold uppercase">Paid</p>
                                <p className="font-black text-green-700 text-lg">₹{bill.deposit_paid.toFixed(0)}</p>
                              </div>
                              <div className={`rounded-lg p-3 text-center border ${bill.amount_due===0?'bg-green-50 border-green-200':'bg-orange-50 border-orange-200'}`}>
                                <p className={`text-xs font-bold uppercase ${bill.amount_due===0?'text-green-600':'text-orange-600'}`}>Due</p>
                                <p className={`font-black text-lg ${bill.amount_due===0?'text-green-700':'text-orange-700'}`}>₹{bill.amount_due.toFixed(0)}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {bill.status!=='Paid'&&(
                          <Button onClick={()=>setShowPayForm(!showPayForm)} className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white gap-2">
                            <CreditCard className="w-4 h-4"/>{showPayForm?'Cancel Payment':'Record Payment'}
                          </Button>
                        )}
                        {bill.status==='Paid'&&(
                          <div className="flex items-center gap-2 mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-green-500"/><span className="text-sm font-semibold text-green-700">Fully Paid</span>
                          </div>
                        )}
                      </Card>
                    )}

                    {/* Payment Form */}
                    {showPayForm && (
                      <Card className="p-5">
                        <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><CreditCard className="w-4 h-4 text-green-600"/>Record Payment</h3>
                        <form onSubmit={handleAddPayment} className="space-y-3">
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="text-xs font-bold text-slate-400 uppercase">Amount (₹) *</label>
                              <Input type="number" step="0.01" min="0.01" value={payForm.amount} onChange={e=>setPayForm(p=>({...p,amount:e.target.value}))} placeholder={`Max ₹${bill.amount_due.toFixed(0)}`} required className="mt-1"/>
                            </div>
                            <div>
                              <label className="text-xs font-bold text-slate-400 uppercase">Mode *</label>
                              <Select value={payForm.payment_mode} onValueChange={v=>setPayForm(p=>({...p,payment_mode:v}))}>
                                <SelectTrigger className="mt-1"><SelectValue/></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Cash">💵 Cash</SelectItem>
                                  <SelectItem value="Card">💳 Card</SelectItem>
                                  <SelectItem value="UPI">📱 UPI</SelectItem>
                                  <SelectItem value="Cheque">🏦 Cheque</SelectItem>
                                  <SelectItem value="Insurance">🛡️ Insurance</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <label className="text-xs font-bold text-slate-400 uppercase">Reference #</label>
                              <Input value={payForm.reference_number} onChange={e=>setPayForm(p=>({...p,reference_number:e.target.value}))} placeholder="Txn / Cheque ID" className="mt-1"/>
                            </div>
                          </div>
                          <Button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-700 text-white">
                            {loading?'Processing...':'✓ Confirm Payment'}
                          </Button>
                        </form>
                      </Card>
                    )}

                    {/* Payment History */}
                    {payments.length>0&&(
                      <Card className="overflow-hidden">
                        <div className="px-5 py-3 border-b bg-slate-50 flex items-center justify-between">
                          <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2"><Clock className="w-4 h-4 text-blue-500"/>Payment History</h3>
                          <span className="text-sm text-slate-500">Collected: <span className="font-bold text-green-600">₹{totalPaid.toFixed(2)}</span></span>
                        </div>
                        <table className="w-full">
                          <thead><tr className="bg-slate-50 border-b">
                            {['#','Date','Mode','Reference','Amount'].map((h,i)=>(
                              <th key={h} className={`px-4 py-2.5 text-xs font-bold text-slate-400 uppercase ${i===4?'text-right':'text-left'}`}>{h}</th>
                            ))}
                          </tr></thead>
                          <tbody>
                            {payments.map((p,i)=>(
                              <tr key={p.id} className="border-b hover:bg-slate-50">
                                <td className="px-4 py-3 text-xs text-slate-400">{i+1}</td>
                                <td className="px-4 py-3 text-sm">{p.payment_date}</td>
                                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                  {Cash:'bg-green-100 text-green-800',Card:'bg-purple-100 text-purple-800',UPI:'bg-indigo-100 text-indigo-800',Cheque:'bg-orange-100 text-orange-800',Insurance:'bg-cyan-100 text-cyan-800'}[p.payment_mode]||'bg-slate-100 text-slate-600'
                                }`}>{p.payment_mode}</span></td>
                                <td className="px-4 py-3 text-xs font-mono text-slate-400">{p.reference_number||'—'}</td>
                                <td className="px-4 py-3 text-sm font-bold text-right text-green-600">₹{p.amount.toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </Card>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-100 flex items-center justify-center"><div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"/></div>}>
      <BillingContent/>
    </Suspense>
  );
}