'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Plus, Trash2, CheckCircle, Receipt, Workflow } from 'lucide-react';

interface Investigation {
  id: number;
  name: string;
  rate: number;
  unit?: string;
}

interface InvestigationDetail {
  id: number;
  investigation_id: number;
  quantity: number;
  rate: number;
  amount: number;
  status: string;
  entry_date: string;
}

const demoInvestigations: Investigation[] = [
  { id: 1, name: 'Blood Test - CBC', rate: 200 },
  { id: 2, name: 'Blood Test - Liver Function', rate: 300 },
  { id: 3, name: 'Blood Test - Kidney Function', rate: 300 },
  { id: 4, name: 'X-Ray Chest', rate: 400 },
  { id: 5, name: 'Ultrasound Abdomen', rate: 500 },
  { id: 6, name: 'ECG', rate: 250 },
  { id: 7, name: 'Thyroid Profile', rate: 350 },
  { id: 8, name: 'Blood Sugar Fasting', rate: 100 }
];

export default function InvestigationsPage() {
  const searchParams = useSearchParams();
  const registrationId = searchParams.get('registrationId');
  const router = useRouter();

  const [investigations, setInvestigations] = useState<Investigation[]>(demoInvestigations);
  const [investigationDetails, setInvestigationDetails] = useState<InvestigationDetail[]>([
    {
      id: 1,
      investigation_id: 1,
      quantity: 1,
      rate: 200,
      amount: 200,
      status: 'Pending',
      entry_date: new Date().toISOString().split('T')[0]
    }
  ]);
  const [selectedInvestigation, setSelectedInvestigation] = useState('1');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Demo mode - data is pre-loaded
  }, [registrationId]);

  const handleAddInvestigation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvestigation) return;

    setError('');
    setSuccess(false);
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      const inv = investigations.find(i => i.id.toString() === selectedInvestigation);
      if (inv) {
        const newDetail: InvestigationDetail = {
          id: investigationDetails.length + 1,
          investigation_id: inv.id,
          quantity: quantity,
          rate: inv.rate,
          amount: inv.rate * quantity,
          status: 'Pending',
          entry_date: new Date().toISOString().split('T')[0]
        };
        setInvestigationDetails([...investigationDetails, newDetail]);
        setSelectedInvestigation('1');
        setQuantity(1);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
      setLoading(false);
    }, 500);
  };

  const totalAmount = investigationDetails.reduce((sum, detail) => sum + detail.amount, 0);

  const selectedInvData = investigations.find(inv => inv.id.toString() === selectedInvestigation);
  const totalForNew = selectedInvData ? selectedInvData.rate * quantity : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/patients')}
            className="p-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Laboratory Investigations</h1>
            <p className="text-xs text-muted-foreground">Manage laboratory tests and investigations for a registration</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!registrationId ? (
          <div className="space-y-4">
            <Alert>
              <AlertDescription>Please select a patient registration first</AlertDescription>
            </Alert>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.push('/ipd-workflow')}><Workflow className="w-4 h-4 mr-2" />Open IPD Workflow</Button>
              <Button onClick={() => router.push('/patients')}>Open Patient Registration</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Add Investigation Form */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground">Add Investigation</h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => router.push(`/ipd-workflow`)}>
                    <Workflow className="w-4 h-4 mr-1" />IPD Flow
                  </Button>
                  <Button size="sm" onClick={() => router.push(`/billing?registrationId=${registrationId}`)}>
                    <Receipt className="w-4 h-4 mr-1" />Billing Ledger
                  </Button>
                </div>
              </div>

              <form onSubmit={handleAddInvestigation} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Investigation Test *</label>
                    <Select value={selectedInvestigation} onValueChange={setSelectedInvestigation}>
                      <SelectTrigger disabled={loading}>
                        <SelectValue placeholder="Select test..." />
                      </SelectTrigger>
                      <SelectContent>
                        {investigations.map(inv => (
                          <SelectItem key={inv.id} value={inv.id.toString()}>
                            {inv.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Quantity</label>
                    <Input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Rate</label>
                    <Input
                      type="text"
                      value={selectedInvData ? `₹${selectedInvData.rate}` : '-'}
                      disabled
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Amount</label>
                    <Input
                      type="text"
                      value={`₹${totalForNew.toFixed(2)}`}
                      disabled
                    />
                  </div>
                </div>

                {error && (
                  <Alert className="bg-destructive/10 border-destructive/20">
                    <AlertDescription className="text-destructive text-sm">{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="bg-green-500/10 border-green-500/20">
                    <AlertDescription className="text-green-600 text-sm flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Investigation added successfully
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  disabled={loading || !selectedInvestigation}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {loading ? 'Adding...' : 'Add Investigation'}
                </Button>
              </form>
            </Card>

            {/* Investigation Details */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-6">
                Selected Investigations ({investigationDetails.length})
              </h2>

              {investigationDetails.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No investigations added yet. Add investigations using the form above.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Test Name</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Quantity</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Rate</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">Amount</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-foreground">Status</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-foreground">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {investigationDetails.map((detail) => {
                        const investigation = investigations.find(inv => inv.id === detail.investigation_id);
                        return (
                          <tr key={detail.id} className="border-b border-border hover:bg-muted/30">
                            <td className="px-4 py-3 text-sm text-foreground">{investigation?.name}</td>
                            <td className="px-4 py-3 text-sm text-foreground">{detail.quantity}</td>
                            <td className="px-4 py-3 text-sm text-foreground">₹{detail.rate.toFixed(2)}</td>
                            <td className="px-4 py-3 text-sm text-foreground text-right font-semibold">₹{detail.amount.toFixed(2)}</td>
                            <td className="px-4 py-3 text-sm text-center">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                detail.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                detail.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {detail.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive/80"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-border bg-muted/50">
                        <td colSpan={3} className="px-4 py-4 text-right font-bold text-foreground">Total Amount:</td>
                        <td className="px-4 py-4 text-right font-bold text-lg text-primary">₹{totalAmount.toFixed(2)}</td>
                        <td colSpan={2}></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              <div className="mt-6 flex gap-4 justify-end">
                <Button variant="outline" onClick={() => router.push('/patients')}>
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
        )}
      </main>
    </div>
  );
}
