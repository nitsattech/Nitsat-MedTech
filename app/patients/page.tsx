'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Search, Plus, User } from 'lucide-react';

interface Patient {
  id: number;
  uhid: string;
  first_name: string;
  last_name?: string;
  date_of_birth?: string;
  gender?: string;
  phone?: string;
  email?: string;
  blood_group?: string;
  city?: string;
  created_at: string;
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  const fetchPatients = async (search = '') => {
    setLoading(true);
    setError('');
    try {
      const url = search
        ? `/api/patients?search=${encodeURIComponent(search)}`
        : '/api/patients';
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setPatients(data);
      } else {
        setError('Failed to load patients');
      }
    } catch {
      setError('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPatients(searchTerm);
  };

  const handleClear = () => {
    setSearchTerm('');
    fetchPatients('');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard')}
            className="p-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">Patients</h1>
            <p className="text-xs text-muted-foreground">View and manage all patients</p>
          </div>
          <Button
            onClick={() => router.push('/patients/new')}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Register New Patient
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Section */}
        <Card className="p-6 mb-8">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              placeholder="Search by UHID, name, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90">
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
            {searchTerm && (
              <Button type="button" variant="outline" onClick={handleClear}>
                Clear
              </Button>
            )}
          </form>
        </Card>

        {error && (
          <Card className="p-4 mb-4 border-destructive/30 bg-destructive/5">
            <p className="text-destructive text-sm">{error}</p>
          </Card>
        )}

        {/* Patients Table */}
        <div className="overflow-x-auto">
          <Card className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">UHID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Gender</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">DOB</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Phone</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Blood</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Registered</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
                      Loading patients...
                    </td>
                  </tr>
                ) : patients.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3 text-muted-foreground">
                        <User className="w-10 h-10 opacity-30" />
                        <p>{searchTerm ? 'No patients found for this search.' : 'No patients registered yet.'}</p>
                        {!searchTerm && (
                          <Button
                            size="sm"
                            onClick={() => router.push('/patients/new')}
                            className="bg-primary hover:bg-primary/90"
                          >
                            Register New Patient
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  patients.map((patient) => (
                    <tr key={patient.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-sm font-mono font-semibold text-primary">{patient.uhid}</span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-foreground">
                        {patient.first_name} {patient.last_name || ''}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {patient.gender || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {patient.date_of_birth || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {patient.phone || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {patient.blood_group ? (
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                            {patient.blood_group}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {new Date(patient.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/patients/${patient.id}/case`)}
                        >
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/patients/${patient.id}/case?tab=billing`)}
                        >
                          Billing
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Card>
        </div>

        {patients.length > 0 && (
          <p className="text-sm text-muted-foreground mt-4">
            Showing {patients.length} patient{patients.length !== 1 ? 's' : ''}
          </p>
        )}
      </main>
    </div>
  );
}