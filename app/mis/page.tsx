'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  ArrowLeft, Search, RefreshCw, BedDouble, Users, Activity,
  TrendingUp, Calendar, Filter, Eye, CreditCard, Printer,
  ChevronDown, Phone, Stethoscope, Building2, Clock
} from 'lucide-react';

interface RegRow {
  id: number; registration_type: string; admission_date: string; admission_time?: string;
  discharge_date?: string; status: string; provisional_diagnosis?: string;
  room_type?: string; bed_number?: string; rate_list?: string; category?: string;
  dept_name?: string; doctor_name?: string; consultant_name?: string;
  referred_by?: string; insurance_company?: string; tpa_name?: string;
  uhid: string; first_name: string; last_name?: string; phone?: string;
  gender?: string; blood_group?: string; date_of_birth?: string;
  additional_consultant?: string;
}

const TYPES = ['All','OPD','IPD'];
const STATUSES = ['All','Active','Discharged','Cancelled'];

export default function MISPage() {
  const router = useRouter();
  const [rows, setRows] = useState<RegRow[]>([]);
  const [filtered, setFiltered] = useState<RegRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('Active');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [useDateFilter, setUseDateFilter] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      let url = `/api/registrations?limit=500`;
      if (useDateFilter && dateFilter) url += `&date=${dateFilter}`;
      const r = await fetch(url);
      if (r.ok) { const d = await r.json(); setRows(Array.isArray(d)?d:[]); }
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [useDateFilter, dateFilter]);

  useEffect(() => {
    let out = rows;
    if (typeFilter !== 'All') out = out.filter(r => r.registration_type === typeFilter);
    if (statusFilter !== 'All') out = out.filter(r => r.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      out = out.filter(r =>
        r.uhid?.toLowerCase().includes(q) ||
        r.first_name?.toLowerCase().includes(q) ||
        (r.last_name||'').toLowerCase().includes(q) ||
        (r.phone||'').includes(q) ||
        (r.doctor_name||r.consultant_name||'').toLowerCase().includes(q) ||
        (r.dept_name||'').toLowerCase().includes(q) ||
        (r.provisional_diagnosis||'').toLowerCase().includes(q)
      );
    }
    setFiltered(out);
  }, [rows, typeFilter, statusFilter, search]);

  const stats = {
    total: rows.length,
    active: rows.filter(r=>r.status==='Active').length,
    ipd: rows.filter(r=>r.registration_type==='IPD'&&r.status==='Active').length,
    opd: rows.filter(r=>r.registration_type==='OPD'&&r.status==='Active').length,
    discharged: rows.filter(r=>r.status==='Discharged').length,
  };

  const age = (dob?: string) => dob ? Math.floor((Date.now()-new Date(dob).getTime())/31557600000) : null;

  const typeColor = (t: string) => t==='IPD'?'bg-blue-100 text-blue-800':'bg-purple-100 text-purple-800';
  const statusColor = (s: string) => s==='Active'?'bg-green-100 text-green-800 border-green-200':s==='Discharged'?'bg-slate-100 text-slate-600 border-slate-200':'bg-red-100 text-red-700 border-red-200';

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b shadow-sm sticky top-0 z-40">
        <div className="max-w-full px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={()=>router.push('/dashboard')} className="p-0"><ArrowLeft className="w-5 h-5"/></Button>
          <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center"><Activity className="w-4 h-4 text-white"/></div>
          <div>
            <p className="font-bold text-slate-800 leading-none">MIS — Management Information System</p>
            <p className="text-xs text-slate-400">NItsat MedTech · Current Occupancy &amp; Registrations</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" onClick={()=>router.push('/patient-registration')} className="bg-blue-700 hover:bg-blue-800 text-white gap-1.5 text-xs">
              + New Registration
            </Button>
            <Button size="sm" variant="outline" onClick={load} className="gap-1.5 text-xs">
              <RefreshCw className="w-3.5 h-3.5"/>Refresh
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-full px-4 py-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            {label:'Total Today',value:stats.total,icon:<Users className="w-5 h-5"/>,color:'bg-slate-700',light:'bg-slate-50 border-slate-200'},
            {label:'Active Patients',value:stats.active,icon:<Activity className="w-5 h-5"/>,color:'bg-green-600',light:'bg-green-50 border-green-200'},
            {label:'IPD (Active)',value:stats.ipd,icon:<BedDouble className="w-5 h-5"/>,color:'bg-blue-700',light:'bg-blue-50 border-blue-200'},
            {label:'OPD (Active)',value:stats.opd,icon:<Stethoscope className="w-5 h-5"/>,color:'bg-purple-700',light:'bg-purple-50 border-purple-200'},
            {label:'Discharged',value:stats.discharged,icon:<TrendingUp className="w-5 h-5"/>,color:'bg-orange-600',light:'bg-orange-50 border-orange-200'},
          ].map(s=>(
            <Card key={s.label} className={`p-4 border ${s.light}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{s.label}</p>
                  <p className="text-3xl font-black text-slate-800 mt-1">{s.value}</p>
                </div>
                <div className={`w-10 h-10 ${s.color} rounded-xl flex items-center justify-center text-white`}>{s.icon}</div>
              </div>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
              <Input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search UHID, patient, doctor, diagnosis..."
                className="pl-9 h-9"/>
            </div>

            {/* Type toggle */}
            <div className="flex rounded-lg border border-slate-200 overflow-hidden">
              {TYPES.map(t=>(
                <button key={t} onClick={()=>setTypeFilter(t)}
                  className={`px-3 py-1.5 text-xs font-bold transition-all ${typeFilter===t?'bg-blue-700 text-white':'bg-white text-slate-600 hover:bg-slate-50'}`}>
                  {t}
                </button>
              ))}
            </div>

            {/* Status toggle */}
            <div className="flex rounded-lg border border-slate-200 overflow-hidden">
              {STATUSES.map(s=>(
                <button key={s} onClick={()=>setStatusFilter(s)}
                  className={`px-3 py-1.5 text-xs font-bold transition-all ${statusFilter===s?'bg-blue-700 text-white':'bg-white text-slate-600 hover:bg-slate-50'}`}>
                  {s}
                </button>
              ))}
            </div>

            {/* Date filter */}
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 cursor-pointer">
                <input type="checkbox" checked={useDateFilter} onChange={e=>setUseDateFilter(e.target.checked)} className="rounded"/>
                Date:
              </label>
              <Input type="date" value={dateFilter} onChange={e=>setDateFilter(e.target.value)}
                disabled={!useDateFilter} className="h-9 w-36 text-xs"/>
            </div>

            <span className="text-xs text-slate-400 ml-auto">{filtered.length} records</span>
          </div>
        </Card>

        {/* Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-800 text-white">
                  {['Mobile','Patient Name','Allocation','Department','Consultant','Add. Consultant','DOA','Days','Ref By','Reg. Type','Insurance','TPA','Category','Diagnosis / Procedure','Actions'].map(h=>(
                    <th key={h} className="px-3 py-3 text-left text-xs font-bold whitespace-nowrap uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={15} className="px-4 py-12 text-center text-slate-400">
                    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"/>Loading...
                  </td></tr>
                ) : filtered.length===0 ? (
                  <tr><td colSpan={15} className="px-4 py-12 text-center text-slate-400">
                    No registrations found. <button onClick={()=>router.push('/patient-registration')} className="text-blue-600 font-semibold underline ml-1">Register a patient</button>
                  </td></tr>
                ) : filtered.map((r,i)=>{
                  const days = Math.floor((Date.now()-new Date(r.admission_date).getTime())/86400000);
                  return (
                    <tr key={r.id} className={`border-b hover:bg-blue-50/40 transition-colors ${i%2===0?'bg-white':'bg-slate-50/50'}`}>
                      {/* Mobile */}
                      <td className="px-3 py-2.5">
                        <p className="text-xs font-mono">{r.phone||'—'}</p>
                        <p className="text-xs font-bold text-blue-700 font-mono">{r.uhid}</p>
                      </td>
                      {/* Name */}
                      <td className="px-3 py-2.5 min-w-36">
                        <p className="font-semibold text-slate-800 text-sm">{r.first_name} {r.last_name||''}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {r.gender&&<span className="text-xs text-slate-400">{r.gender}</span>}
                          {age(r.date_of_birth)&&<span className="text-xs text-slate-400">{age(r.date_of_birth)}Y</span>}
                          {r.blood_group&&<span className="text-xs font-bold text-red-600 bg-red-50 px-1 rounded">{r.blood_group}</span>}
                        </div>
                      </td>
                      {/* Room */}
                      <td className="px-3 py-2.5">
                        {r.room_type ? (
                          <div className="flex items-center gap-1.5">
                            <BedDouble className="w-3.5 h-3.5 text-slate-400"/>
                            <div>
                              <p className="text-xs font-semibold text-slate-700">{r.room_type}</p>
                              {r.bed_number&&<p className="text-xs text-slate-400">Unit {r.bed_number}</p>}
                            </div>
                          </div>
                        ) : <span className="text-xs text-slate-300">NA</span>}
                      </td>
                      {/* Dept */}
                      <td className="px-3 py-2.5 text-xs text-slate-600">{r.dept_name||'—'}</td>
                      {/* Consultant */}
                      <td className="px-3 py-2.5">
                        {(r.doctor_name||r.consultant_name) ? (
                          <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <Stethoscope className="w-3 h-3 text-blue-600"/>
                            </div>
                            <span className="text-xs font-semibold text-slate-700">{r.doctor_name||r.consultant_name}</span>
                          </div>
                        ) : <span className="text-xs text-slate-300">NA</span>}
                      </td>
                      {/* Add Consultant */}
                      <td className="px-3 py-2.5 text-xs text-slate-500">{r.additional_consultant||<span className="text-slate-300">NA</span>}</td>
                      {/* DOA */}
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <p className="text-xs font-semibold text-slate-700">{r.admission_date}</p>
                        {r.admission_time&&<p className="text-xs text-slate-400">{r.admission_time}</p>}
                      </td>
                      {/* Days */}
                      <td className="px-3 py-2.5 text-center">
                        <span className={`text-sm font-bold ${days>7?'text-orange-600':days>3?'text-yellow-600':'text-slate-700'}`}>{days}</span>
                      </td>
                      {/* Referred By */}
                      <td className="px-3 py-2.5 text-xs text-slate-600">{r.referred_by||'SELF'}</td>
                      {/* Type */}
                      <td className="px-3 py-2.5">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${typeColor(r.registration_type)}`}>{r.registration_type}</span>
                        <div className="mt-1">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${statusColor(r.status)}`}>{r.status}</span>
                        </div>
                      </td>
                      {/* Insurance */}
                      <td className="px-3 py-2.5 text-xs text-slate-600">{r.insurance_company||'NA'}</td>
                      {/* TPA */}
                      <td className="px-3 py-2.5 text-xs text-slate-600">{r.tpa_name||'NA'}</td>
                      {/* Category */}
                      <td className="px-3 py-2.5">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          r.category==='Cash'?'bg-green-100 text-green-800':r.category==='Insurance'?'bg-blue-100 text-blue-800':'bg-slate-100 text-slate-700'
                        }`}>{r.category||'Cash'}</span>
                      </td>
                      {/* Diagnosis */}
                      <td className="px-3 py-2.5 max-w-40">
                        <p className="text-xs font-semibold text-slate-700 truncate">{r.provisional_diagnosis||'—'}</p>
                      </td>
                      {/* Actions */}
                      <td className="px-3 py-2.5">
                        <div className="flex gap-1.5 items-center">
                          <button onClick={()=>router.push(`/billing?registrationId=${r.id}`)}
                            title="Billing" className="p-1.5 rounded border border-slate-200 text-slate-400 hover:text-green-600 hover:border-green-300 transition-all">
                            <CreditCard className="w-3.5 h-3.5"/>
                          </button>
                          <button onClick={()=>router.push(`/patient-registration`)}
                            title="Revisit" className="p-1.5 rounded border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-300 transition-all">
                            <RefreshCw className="w-3.5 h-3.5"/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          {filtered.length>0&&(
            <div className="px-4 py-3 bg-slate-50 border-t flex items-center justify-between text-xs text-slate-500">
              <span>Showing {filtered.length} of {rows.length} records</span>
              <div className="flex gap-4">
                <span>IPD Active: <strong className="text-blue-700">{filtered.filter(r=>r.registration_type==='IPD'&&r.status==='Active').length}</strong></span>
                <span>OPD Active: <strong className="text-purple-700">{filtered.filter(r=>r.registration_type==='OPD'&&r.status==='Active').length}</strong></span>
                <span>Total Discharged: <strong className="text-slate-600">{filtered.filter(r=>r.status==='Discharged').length}</strong></span>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}