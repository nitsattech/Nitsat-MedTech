'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, Calendar, User, Phone } from 'lucide-react';

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
}

interface PatientSearchProps {
  onPatientSelected: (patient: Patient) => void;
}

export default function PatientSearchComponent({ onPatientSelected }: PatientSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searched, setSearched] = useState(false);

  // Load all patients on mount
  useEffect(() => {
    fetch('/api/patients')
      .then(r => r.json())
      .then(data => {
        setAllPatients(Array.isArray(data) ? data : []);
        setPatients(Array.isArray(data) ? data : []);
      })
      .catch(() => {})
      .finally(() => setInitialLoading(false));
  }, []);

  // Live filter as user types (client-side for quick feel)
  useEffect(() => {
    if (!searchTerm.trim()) {
      setPatients(allPatients);
      setSearched(false);
      return;
    }
    const term = searchTerm.toLowerCase();
    const filtered = allPatients.filter(p =>
      p.uhid.toLowerCase().includes(term) ||
      p.first_name.toLowerCase().includes(term) ||
      (p.last_name || '').toLowerCase().includes(term) ||
      (p.phone || '').includes(term)
    );
    setPatients(filtered);
    setSearched(true);
  }, [searchTerm, allPatients]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      setPatients(allPatients);
      return;
    }
    // Also do a server-side search to ensure DB is fresh
    setLoading(true);
    setSearched(true);
    try {
      const response = await fetch(`/api/patients?search=${encodeURIComponent(searchTerm)}`);
      if (response.ok) {
        const data = await response.json();
        setPatients(data);
        // Update allPatients cache with any new results
        setAllPatients(prev => {
          const ids = new Set(prev.map(p => p.id));
          const newOnes = data.filter((p: Patient) => !ids.has(p.id));
          return [...prev, ...newOnes];
        });
      }
    } catch (error) {
      console.error('Error searching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setPatients(allPatients);
    setSearched(false);
  };

  return (
    <div className="space-y-4">
      {/* Search Box */}
      <Card className="p-6">
        <form onSubmit={handleSearch} className="space-y-3">
          <label className="block text-sm font-medium text-foreground">
            Search Patient by UHID, Name, or Phone
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="e.g. UHID-2026-0001 or John or 9876..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                autoFocus
              />
            </div>
            <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90">
              {loading ? 'Searching...' : 'Search'}
            </Button>
            {searchTerm && (
              <Button type="button" variant="outline" onClick={clearSearch}>
                Clear
              </Button>
            )}
          </div>
        </form>
      </Card>

      {/* Results */}
      {initialLoading ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground text-sm">Loading patients...</p>
        </Card>
      ) : patients.length === 0 && searched ? (
        <Alert>
          <AlertDescription>
            No patients found for "<strong>{searchTerm}</strong>". Try a different name, UHID, or phone number.
          </AlertDescription>
        </Alert>
      ) : patients.length === 0 && !searched ? (
        <Card className="p-8 text-center">
          <User className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No patients registered yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Use the "New Patient" tab to add one.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium px-1">
            {searchTerm
              ? `${patients.length} result${patients.length !== 1 ? 's' : ''} for "${searchTerm}"`
              : `${patients.length} patient${patients.length !== 1 ? 's' : ''} registered`
            }
          </p>
          {patients.map((patient) => (
            <Card
              key={patient.id}
              className="p-4 hover:border-primary/60 hover:bg-primary/5 cursor-pointer transition-all"
              onClick={() => onPatientSelected(patient)}
            >
              <div className="flex justify-between items-center gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground">
                        {patient.first_name} {patient.last_name || ''}
                      </h3>
                      <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                        {patient.uhid}
                      </span>
                      {patient.blood_group && (
                        <span className="text-xs font-medium bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                          {patient.blood_group}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                      {patient.gender && <span>{patient.gender}</span>}
                      {patient.date_of_birth && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {patient.date_of_birth}
                        </span>
                      )}
                      {patient.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {patient.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPatientSelected(patient);
                  }}
                >
                  Select
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}