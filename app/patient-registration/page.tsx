import { redirect } from 'next/navigation';

export default function PatientRegistrationRedirectPage() {
  redirect('/patients/new');
}
