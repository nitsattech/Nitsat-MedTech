'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Plus, Search } from 'lucide-react';
import PatientSearchComponent from '@/components/patient-search';
import PatientFormComponent from '@/components/patient-form';
import RegistrationFormComponent from '@/components/registration-form';

export default function PatientRegistrationPage() {
  const [activeTab, setActiveTab] = useState('search');
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const router = useRouter();

  const handlePatientSelected = async (patient: any) => {
    setSelectedPatient(patient);
    setActiveTab('register');

    // Fetch existing registrations
    try {
      const response = await fetch(`/api/registrations?patientId=${patient.id}`);
      if (response.ok) {
        const data = await response.json();
        setRegistrations(data);
      }
    } catch (error) {
      console.error('Error fetching registrations:', error);
    }
  };

  const handleNewPatientCreated = (patient: any) => {
    setSelectedPatient(patient);
    setActiveTab('register');
  };

  const handleRegistrationSuccess = () => {
    setActiveTab('search');
    setSelectedPatient(null);
  };

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
            <h1 className="text-2xl font-bold text-foreground">Patient Registration</h1>
            <p className="text-xs text-muted-foreground">IPD/OPD Patient Management</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Search Patient
            </TabsTrigger>
            <TabsTrigger value="new" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New Patient
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-6">
            <PatientSearchComponent onPatientSelected={handlePatientSelected} />
          </TabsContent>

          <TabsContent value="new" className="space-y-6">
            <PatientFormComponent onPatientCreated={handleNewPatientCreated} />
          </TabsContent>

          <TabsContent value="register" className="space-y-6">
            {selectedPatient ? (
              <div className="space-y-6">
                <Card className="p-6 bg-primary/5 border-primary/20">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Selected Patient</p>
                      <p className="text-lg font-semibold text-foreground">
                        {selectedPatient.first_name} {selectedPatient.last_name || ''}
                      </p>
                      <p className="text-sm text-muted-foreground">UHID: {selectedPatient.uhid}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveTab('search')}
                    >
                      Change
                    </Button>
                  </div>
                </Card>

                {/* Previous Registrations */}
                {registrations.length > 0 && (
                  <Card className="p-6">
                    <h3 className="font-semibold text-foreground mb-4">Previous Registrations</h3>
                    <div className="space-y-2">
                      {registrations.map((reg: any) => (
                        <div key={reg.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                          <div>
                            <p className="text-sm font-medium text-foreground">{reg.registration_type}</p>
                            <p className="text-xs text-muted-foreground">{reg.admission_date} - {reg.status}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/investigations?registrationId=${reg.id}`)}
                          >
                            View
                          </Button>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                <RegistrationFormComponent
                  patientId={selectedPatient.id}
                  onSuccess={handleRegistrationSuccess}
                />
              </div>
            ) : (
              <Alert>
                <AlertDescription>Please select or create a patient first</AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
