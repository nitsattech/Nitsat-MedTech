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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { ArrowLeft, Plus, Calendar, Clock, Trash2, CheckCircle } from 'lucide-react';

const demoAppointments = [
  {
    id: 1,
    patient_name: 'John Doe',
    patient_phone: '9876543210',
    appointment_date: '2026-02-25',
    appointment_time: '10:00',
    doctor_name: 'Dr. Smith',
    reason: 'General Checkup',
    status: 'Scheduled'
  },
  {
    id: 2,
    patient_name: 'Jane Williams',
    patient_phone: '9876543211',
    appointment_date: '2026-02-24',
    appointment_time: '14:30',
    doctor_name: 'Dr. Johnson',
    reason: 'Cardiac Consultation',
    status: 'Completed'
  },
  {
    id: 3,
    patient_name: 'Robert Brown',
    patient_phone: '9876543212',
    appointment_date: '2026-02-23',
    appointment_time: '11:15',
    doctor_name: 'Dr. Williams',
    reason: 'Follow-up',
    status: 'Cancelled'
  }
];

export default function AppointmentsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('schedule');

  const [formData, setFormData] = useState({
    patient_name: '',
    patient_phone: '',
    appointment_date: '',
    appointment_time: '',
    doctor_name: '',
    reason: '',
    status: 'Scheduled'
  });

  const [appointments, setAppointments] = useState<any[]>(demoAppointments);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleScheduleAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.patient_name || !formData.appointment_date || !formData.appointment_time) {
      setError('Please fill all required fields');
      return;
    }

    setLoading(true);

    try {
      // Add appointment to list (for demo purposes)
      const newAppointment = {
        id: Date.now(),
        ...formData
      };
      setAppointments([...appointments, newAppointment]);
      setFormData({
        patient_name: '',
        patient_phone: '',
        appointment_date: '',
        appointment_time: '',
        doctor_name: '',
        reason: '',
        status: 'Scheduled'
      });
      setSuccess('Appointment scheduled successfully');
      setTimeout(() => setSuccess(''), 3000);
      setActiveTab('list');
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = (id: number) => {
    setAppointments(appointments.map(apt =>
      apt.id === id ? { ...apt, status: 'Cancelled' } : apt
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      case 'No Show':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
            <h1 className="text-2xl font-bold text-foreground">OPD Appointments</h1>
            <p className="text-xs text-muted-foreground">Schedule and manage outpatient appointments</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="schedule" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Schedule
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              List
            </TabsTrigger>
          </TabsList>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-6">Schedule New Appointment</h2>

              <form onSubmit={handleScheduleAppointment} className="space-y-6">
                {/* Patient Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">Patient Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-foreground">Patient Name *</label>
                      <Input
                        name="patient_name"
                        value={formData.patient_name}
                        onChange={handleInputChange}
                        placeholder="John Doe"
                        disabled={loading}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-foreground">Phone Number</label>
                      <Input
                        name="patient_phone"
                        type="tel"
                        value={formData.patient_phone}
                        onChange={handleInputChange}
                        placeholder="+91 9999999999"
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>

                {/* Appointment Details */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">Appointment Details</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-foreground">Date *</label>
                      <Input
                        name="appointment_date"
                        type="date"
                        value={formData.appointment_date}
                        onChange={handleInputChange}
                        disabled={loading}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-foreground">Time *</label>
                      <Input
                        name="appointment_time"
                        type="time"
                        value={formData.appointment_time}
                        onChange={handleInputChange}
                        disabled={loading}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Doctor Name</label>
                    <Input
                      name="doctor_name"
                      value={formData.doctor_name}
                      onChange={handleInputChange}
                      placeholder="Dr. Name"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Reason for Visit</label>
                    <textarea
                      name="reason"
                      value={formData.reason}
                      onChange={handleInputChange}
                      placeholder="Enter reason..."
                      disabled={loading}
                      rows={3}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
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
                      {success}
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  {loading ? 'Scheduling...' : 'Schedule Appointment'}
                </Button>
              </form>
            </Card>
          </TabsContent>

          {/* List Tab */}
          <TabsContent value="list" className="space-y-6">
            {appointments.length === 0 ? (
              <Alert>
                <AlertDescription>No appointments scheduled yet. Click the "Schedule" tab to create one.</AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {/* Upcoming Appointments */}
                <Card className="p-6">
                  <h3 className="text-lg font-bold text-foreground mb-4">Upcoming Appointments</h3>

                  <div className="space-y-3">
                    {appointments
                      .filter(apt => apt.status !== 'Cancelled')
                      .sort((a, b) => new Date(`${a.appointment_date}T${a.appointment_time}`).getTime() - new Date(`${b.appointment_date}T${b.appointment_time}`).getTime())
                      .map(appointment => (
                        <div key={appointment.id} className="p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors">
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1">
                              <h4 className="font-semibold text-foreground">{appointment.patient_name}</h4>
                              <div className="grid grid-cols-2 gap-3 mt-2 text-sm text-muted-foreground">
                                <p className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {appointment.appointment_date}
                                </p>
                                <p className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {appointment.appointment_time}
                                </p>
                                {appointment.doctor_name && <p>Doctor: {appointment.doctor_name}</p>}
                                {appointment.patient_phone && <p>Phone: {appointment.patient_phone}</p>}
                              </div>
                              {appointment.reason && (
                                <p className="text-sm text-muted-foreground mt-2">Reason: {appointment.reason}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-3 py-1 rounded text-xs font-medium ${getStatusColor(appointment.status)}`}>
                                {appointment.status}
                              </span>
                              {appointment.status === 'Scheduled' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCancelAppointment(appointment.id)}
                                  className="text-destructive hover:text-destructive/80"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </Card>

                {/* Cancelled Appointments */}
                {appointments.some(apt => apt.status === 'Cancelled') && (
                  <Card className="p-6">
                    <h3 className="text-lg font-bold text-foreground mb-4">Cancelled Appointments</h3>

                    <div className="space-y-3">
                      {appointments
                        .filter(apt => apt.status === 'Cancelled')
                        .map(appointment => (
                          <div key={appointment.id} className="p-4 border border-border rounded-lg bg-muted/30 opacity-75">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-semibold text-foreground line-through">{appointment.patient_name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {appointment.appointment_date} at {appointment.appointment_time}
                                </p>
                              </div>
                              <span className={`px-3 py-1 rounded text-xs font-medium ${getStatusColor(appointment.status)}`}>
                                {appointment.status}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
