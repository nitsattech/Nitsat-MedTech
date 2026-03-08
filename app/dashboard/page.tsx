'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Users,
  Stethoscope,
  Pill,
  Microscope,
  DollarSign,
  FileText,
  Heart,
  LogOut,
} from 'lucide-react';

const getUserRole = () => {
  if (typeof document === 'undefined') return null;
  const cookie = document.cookie
    .split('; ')
    .find((row) => row.startsWith('userRole='));
  return cookie ? cookie.split('=')[1] : null;
};

interface Department {
  id: number;
  name: string;
  description: string;
}


const allDepartments: Department[] = [
  { id: 1, name: 'OPD', description: 'OPD end-to-end workflow' },
  { id: 2, name: 'IPD', description: 'In Patient Department' },
  { id: 3, name: 'Medicines', description: 'Pharmacy Inventory & Dispensing' },
  { id: 4, name: 'Services', description: 'Hospital Services' },
  { id: 5, name: 'Investigation', description: 'Laboratory & Diagnostic Tests' },
  { id: 6, name: 'Payment', description: 'Payment & Transactions' },
  { id: 7, name: 'O.T.', description: 'Operation Theatre' },
  { id: 8, name: 'Discharge', description: 'Discharge and billing clearance' },
  { id: 9, name: 'Billing', description: 'Billing & Payments' },
  { id: 10, name: 'File', description: 'Patient Records & Files' },
  { id: 11, name: 'MIS', description: 'Daily hospital reports and analytics' },
  { id: 12, name: 'Pathology', description: 'Lab & Pathology Department' },
  { id: 13, name: 'Sonography', description: 'Sonography Investigations' },
  { id: 14, name: 'Radiology', description: 'Radiology & Imaging' },
  { id: 15, name: 'Cardiology', description: 'Heart & Cardiac Care' },
  { id: 16, name: 'Gastrology', description: 'Gastro Department' },
  { id: 17, name: 'ABHA', description: 'ABHA Records & Management' },
  {id: 18, name: 'Appointments', description: 'Human Resources & Staff Management' },

];

const moduleRoutes: Record<string, string> = {
  OPD: '/opd-flow',
  IPD: '/ipd-workflow',
  Medicines: '/pharmacy',

  // ⭐ IMPORTANT: Investigation needs registrationId
  Investigation: '/investigations?registrationId=1',
  Pathology: '/investigations?registrationId=1',
  Sonography: '/investigations?registrationId=1',
  Radiology: '/investigations?registrationId=1',

  Billing: '/billing',
  Payment: '/billing',
  File: '/patients',
  ABHA: '/abha',
  MIS: '/mis',
  Appointments: '/appointments',
};

const roleAccess: Record<string, string[]> = {
  admin: allDepartments.map((d) => d.name), // FULL HMS
  doctor: ['OPD', 'File'],
  receptionist: ['OPD', 'File'],
  lab_technician: ['Investigation', 'Pathology', 'Sonography', 'Radiology'],
  pharmacist: ['Medicines'],
  accountant: ['Billing', 'Payment', 'MIS'],
};

const icons: Record<string, React.ReactNode> = {
  OPD: <Users className="w-10 h-10" />,
  IPD: <Stethoscope className="w-10 h-10" />,
  Medicines: <Pill className="w-10 h-10" />,
  Investigation: <Microscope className="w-10 h-10" />,
  Pathology: <Microscope className="w-10 h-10" />,
  Billing: <DollarSign className="w-10 h-10" />,
  Payment: <DollarSign className="w-10 h-10" />,
  MIS: <FileText className="w-10 h-10" />,
  Cardiology: <Heart className="w-10 h-10" />,
};

export default function DashboardPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const router = useRouter();

  useEffect(() => {
    const role = getUserRole();
    console.log('ROLE:', role);

    if (!role) return;

    if (role === 'admin') {
      // 👑 ADMIN = FULL HMS DASHBOARD (like your 2nd screenshot)
      setDepartments(allDepartments);
      return;
    }

    const allowed = roleAccess[role] || [];
    const filtered = allDepartments.filter((dept) =>
      allowed.includes(dept.name)
    );

    setDepartments(filtered);
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const handleModuleClick = (dept: Department) => {
    const route = moduleRoutes[dept.name] || '/dashboard';
    router.push(route);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* HEADER */}
      {/* <header className="bg-white border-b shadow-sm px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Nitsat MedTech HMS</h1>
          <p className="text-sm text-gray-500">Hospital Management System</p>
        </div>

        <Button variant="destructive" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </header> */}

      {/* MAIN */}
      <main className="p-8 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold mb-2">
          Welcome to Nitsat MedTech
        </h2>
        <p className="text-gray-500 mb-8">
          Select a department to begin
        </p>

        {/* FULL HMS GRID (ADMIN STYLE) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {departments.map((dept) => (
            <Card
              key={dept.id}
              className="p-6 cursor-pointer hover:shadow-xl transition-all duration-300 hover:border-teal-500"
              onClick={() => handleModuleClick(dept)}
            >
              <div className="flex flex-col items-center text-center gap-4">
                <div className="p-4 bg-teal-100 rounded-2xl text-teal-700">
                  {icons[dept.name] || <Stethoscope className="w-10 h-10" />}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{dept.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {dept.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}