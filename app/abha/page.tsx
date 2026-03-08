'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShieldPlus } from 'lucide-react';

export default function AbhaPage() {

  const [mobile, setMobile] = useState('');
  const [abha, setAbha] = useState('');
  const [mode, setMode] = useState<'check' | 'create'>('check');

  return (
    <div className="min-h-screen bg-slate-100 p-8">

      <Card className="p-6 mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShieldPlus className="w-6 h-6 text-teal-600" />
          ABHA Management
        </h1>

        <p className="text-sm text-slate-500">
          Create or link patient ABHA ID with ABDM network
        </p>
      </Card>


      <Card className="p-6 space-y-4">

        <h2 className="font-semibold">Check Existing ABHA</h2>

        <Input
          placeholder="Enter Mobile Number"
          value={mobile}
          onChange={(e)=>setMobile(e.target.value)}
        />

        <Input
          placeholder="OR Enter ABHA Number"
          value={abha}
          onChange={(e)=>setAbha(e.target.value)}
        />

        <div className="flex gap-3">

          <Button
            onClick={()=>{
              console.log('Check ABHA API call');
            }}
          >
            Check ABHA
          </Button>

          <Button
            variant="outline"
            onClick={()=>setMode('create')}
          >
            Create New ABHA
          </Button>

        </div>

      </Card>


      {mode === 'create' && (

        <Card className="p-6 mt-6 space-y-4">

          <h2 className="font-semibold">
            Create New ABHA
          </h2>

          <Input placeholder="Patient Name" />
          <Input placeholder="Mobile Number" />
          <Input placeholder="Year of Birth" />

          <Button>
            Generate ABHA (OTP)
          </Button>

        </Card>

      )}

    </div>
  );
}