'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { ArrowLeft, Plus, Edit2, Trash2, Package, AlertCircle } from 'lucide-react';

interface Medicine {
  id: number;
  name: string;
  generic_name?: string;
  batch_number?: string;
  expiry_date?: string;
  rate: number;
  unit?: string;
  quantity_in_stock: number;
  is_active: boolean;
}

const demoMedicines: Medicine[] = [
  { id: 1, name: 'Paracetamol', generic_name: 'Paracetamol', batch_number: 'BAT001', expiry_date: '2025-12-31', rate: 50, unit: 'Tablet', quantity_in_stock: 500, is_active: true },
  { id: 2, name: 'Aspirin', generic_name: 'Aspirin', batch_number: 'BAT002', expiry_date: '2025-11-30', rate: 100, unit: 'Tablet', quantity_in_stock: 300, is_active: true },
  { id: 3, name: 'Amoxicillin', generic_name: 'Amoxicillin', batch_number: 'BAT003', expiry_date: '2025-10-15', rate: 150, unit: 'Capsule', quantity_in_stock: 200, is_active: true },
  { id: 4, name: 'Ibuprofen', generic_name: 'Ibuprofen', batch_number: 'BAT004', expiry_date: '2026-01-20', rate: 80, unit: 'Tablet', quantity_in_stock: 45, is_active: true },
  { id: 5, name: 'Ciprofloxacin', generic_name: 'Ciprofloxacin', batch_number: 'BAT005', expiry_date: '2025-09-30', rate: 120, unit: 'Tablet', quantity_in_stock: 100, is_active: true },
  { id: 6, name: 'Metformin', generic_name: 'Metformin', batch_number: 'BAT006', expiry_date: '2026-02-14', rate: 40, unit: 'Tablet', quantity_in_stock: 600, is_active: true }
];

export default function PharmacyPage() {
  const [medicines, setMedicines] = useState<Medicine[]>(demoMedicines);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    generic_name: '',
    batch_number: '',
    expiry_date: '',
    rate: '',
    unit: 'Tablet',
    quantity_in_stock: ''
  });

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async (search?: string) => {
    setLoading(true);
    try {
      const query = search ? `?search=${encodeURIComponent(search)}` : '';
      const response = await fetch(`/api/medicines${query}`);

      if (!response.ok) {
        throw new Error('Failed to fetch medicines');
      }

      const data: Medicine[] = await response.json();
      setMedicines(data);
    } catch (err) {
      console.error('Error fetching medicines:', err);
      // fallback so workflow keeps running even if API is unavailable
      if (search) {
        const filtered = demoMedicines.filter(med =>
          med.name.toLowerCase().includes(search.toLowerCase()) ||
          med.generic_name?.toLowerCase().includes(search.toLowerCase())
        );
        setMedicines(filtered);
      } else {
        setMedicines(demoMedicines);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMedicines(searchTerm);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.name || !formData.rate) {
      setError('Name and rate are required');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/medicines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          rate: parseFloat(formData.rate),
          quantity_in_stock: parseInt(formData.quantity_in_stock) || 0
        })
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to add medicine');
        setLoading(false);
        return;
      }

      const newMedicine = await response.json();
      setMedicines([...medicines, newMedicine]);
      setFormData({
        name: '',
        generic_name: '',
        batch_number: '',
        expiry_date: '',
        rate: '',
        unit: 'Tablet',
        quantity_in_stock: ''
      });
      setSuccess('Medicine added successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const lowStockMedicines = medicines.filter(m => m.quantity_in_stock < 50);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard')}
            className="p-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Pharmacy Management</h1>
            <p className="text-xs text-muted-foreground">Manage medicines and inventory</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="inventory" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="add">Add Medicine</TabsTrigger>
          </TabsList>

          {/* Inventory Tab */}
          <TabsContent value="inventory" className="space-y-6">
            {lowStockMedicines.length > 0 && (
              <Alert className="border-orange-200 bg-orange-50">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  {lowStockMedicines.length} medicine(s) with low stock (less than 50 units)
                </AlertDescription>
              </Alert>
            )}

            {/* Search */}
            <Card className="p-6">
              <form onSubmit={handleSearch} className="flex gap-2">
                <Input
                  placeholder="Search medicines by name, generic name, or batch number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-primary hover:bg-primary/90"
                >
                  {loading ? 'Searching...' : 'Search'}
                </Button>
              </form>
            </Card>

            {/* Medicines Table */}
            <Card className="p-0 overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Medicine Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Generic Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Batch #</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Expiry</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-foreground">Rate</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-foreground">Stock</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-foreground">Status</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {medicines.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-muted-foreground">
                        No medicines found.
                      </td>
                    </tr>
                  ) : (
                    medicines.map((medicine) => {
                      const isExpired = medicine.expiry_date && new Date(medicine.expiry_date) < new Date();
                      const isLowStock = medicine.quantity_in_stock < 50;

                      return (
                        <tr key={medicine.id} className="border-b border-border hover:bg-muted/30">
                          <td className="px-6 py-4 text-sm font-medium text-foreground">{medicine.name}</td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">{medicine.generic_name || '-'}</td>
                          <td className="px-6 py-4 text-sm font-mono text-muted-foreground">{medicine.batch_number || '-'}</td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">{medicine.expiry_date || '-'}</td>
                          <td className="px-6 py-4 text-sm font-semibold text-foreground text-right">
                            ₹{medicine.rate.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-right">
                            <span className={isLowStock ? 'text-orange-600' : 'text-foreground'}>
                              {medicine.quantity_in_stock}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex justify-center gap-1 flex-wrap">
                              {isExpired && (
                                <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                                  Expired
                                </span>
                              )}
                              {isLowStock && (
                                <span className="px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800">
                                  Low Stock
                                </span>
                              )}
                              {!isExpired && !isLowStock && (
                                <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                                  Active
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center flex justify-center gap-2">
                            <Button variant="ghost" size="sm">
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive/80">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </Card>

            <p className="text-sm text-muted-foreground">
              Total medicines: {medicines.length}
            </p>
          </TabsContent>

          {/* Add Medicine Tab */}
          <TabsContent value="add" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Add New Medicine
              </h2>

              <form onSubmit={handleAddMedicine} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Medicine Name *</label>
                    <Input
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g., Paracetamol"
                      disabled={loading}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Generic Name</label>
                    <Input
                      name="generic_name"
                      value={formData.generic_name}
                      onChange={handleInputChange}
                      placeholder="e.g., Acetaminophen"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Batch Number</label>
                    <Input
                      name="batch_number"
                      value={formData.batch_number}
                      onChange={handleInputChange}
                      placeholder="e.g., B12345"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Expiry Date</label>
                    <Input
                      name="expiry_date"
                      type="date"
                      value={formData.expiry_date}
                      onChange={handleInputChange}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Rate (₹) *</label>
                    <Input
                      name="rate"
                      type="number"
                      step="0.01"
                      value={formData.rate}
                      onChange={handleInputChange}
                      placeholder="50.00"
                      disabled={loading}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Unit</label>
                    <Input
                      name="unit"
                      value={formData.unit}
                      onChange={handleInputChange}
                      placeholder="Tablet"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Initial Stock</label>
                    <Input
                      name="quantity_in_stock"
                      type="number"
                      value={formData.quantity_in_stock}
                      onChange={handleInputChange}
                      placeholder="100"
                      disabled={loading}
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
                    <AlertDescription className="text-green-600 text-sm">{success}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  {loading ? 'Adding...' : 'Add Medicine'}
                </Button>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
