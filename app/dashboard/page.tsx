'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Users,
  Stethoscope,
  Heart,
  Pill,
  Microscope,
  DollarSign,
  Calendar,
  FileText,
  LogOut,
  Menu,
  X
} from 'lucide-react';

interface Department {
  id: number;
  name: string;
  icon?: string;
}

const departmentIcons: Record<string, React.ReactNode> = {
  'OPD': <Users className="w-8 h-8" />,
  'IPD': <Stethoscope className="w-8 h-8" />,
  'Pharmacy': <Pill className="w-8 h-8" />,
  'Lab': <Microscope className="w-8 h-8" />,
  'Cardiology': <Heart className="w-8 h-8" />,
  'Billing': <DollarSign className="w-8 h-8" />,
  'Pathology': <FileText className="w-8 h-8" />,
  'Surgery': <Stethoscope className="w-8 h-8" />
};

const moduleRoutes: Record<string, string> = {
  'OPD': '/patients',
  'IPD': '/patients',
  'Medicines': '/patients',
  'Investigation': '/patients',
  'Cardiology': '/patients',
  'Billing': '/patients',
  'Pathology': '/patients',
  'Services': '/patients',
  'Payment': '/patients',
  'Discharge': '/patients',
  'MIS': '/mis',
  'Sonography': '/patients',
  'Radiology': '/patients',
  'File': '/patients',
  'O.T.': '/patients',
  'Gastrology': '/patients'
};

const demoDepartments: Department[] = [
  { id: 1, name: 'OPD' },
  { id: 2, name: 'IPD' },
  { id: 3, name: 'Medicines' },
  { id: 4, name: 'Services' },
  { id: 5, name: 'Investigation' },
  { id: 6, name: 'Payment' },
  { id: 7, name: 'O.T.' },
  { id: 8, name: 'Discharge' },
  { id: 9, name: 'Billing' },
  { id: 10, name: 'File' },
  { id: 11, name: 'MIS' },
  { id: 12, name: 'Pathology' },
  { id: 13, name: 'Sonography' },
  { id: 14, name: 'Radiology' },
  { id: 15, name: 'Cardiology' },
  { id: 16, name: 'Gastrology' }
];

export default function DashboardPage() {
  const [departments] = useState<Department[]>(demoDepartments);
  const loading = false;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const handleModuleClick = (department: Department) => {
    const route = moduleRoutes[department.name] || '/patient-registration';
    router.push(route);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-4">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Nitsat MedTech HMS</h1>
            <p className="text-xs text-muted-foreground">Hospital Management System</p>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-muted-foreground hover:text-foreground"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/patients')}
            >
              Patients
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-destructive hover:text-destructive"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border px-4 py-4 space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                router.push('/patients');
                setMobileMenuOpen(false);
              }}
            >
              Patients
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-destructive hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Welcome to Nitsat MedTech</h2>
          <p className="text-muted-foreground">Select a department to begin</p>
        </div>

        {/* Departments Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {departments.map((dept) => (
            <Card
              key={dept.id}
              className="p-6 cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all duration-300 group"
              onClick={() => handleModuleClick(dept)}
            >
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="p-4 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                  <div className="text-primary">
                    {departmentIcons[dept.name] || <Stethoscope className="w-8 h-8" />}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-lg">{dept.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {dept.name === 'OPD' && 'OPD end-to-end workflow'}
                    {dept.name === 'IPD' && 'In Patient Department'}
                    {dept.name === 'Medicines' && 'Pharmacy Inventory & Dispensing'}
                    {dept.name === 'Investigation' && 'Laboratory & Diagnostic Tests'}
                    {dept.name === 'Billing' && 'Billing & Payments'}
                    {dept.name === 'Discharge' && 'Discharge and billing clearance'}
                    {dept.name === 'MIS' && 'Daily hospital reports and analytics'}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 bg-primary/5 border-primary/20">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground font-medium">Active Patients</p>
              <p className="text-3xl font-bold text-foreground">--</p>
            </div>
          </Card>
          <Card className="p-6 bg-accent/5 border-accent/20">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground font-medium">Today's Appointments</p>
              <p className="text-3xl font-bold text-foreground">--</p>
            </div>
          </Card>
          <Card className="p-6 bg-muted/50 border-border">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground font-medium">Pending Bills</p>
              <p className="text-3xl font-bold text-foreground">--</p>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
