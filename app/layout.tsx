import './globals.css';
import Navbar from '@/components/layout/Navbar';
export const metadata = {
  title: "Nitsat MedTech HMS",
  description: "Hospital Management System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <html lang="en">
      <body className="bg-slate-100">

        <Navbar />

        <main className="p-6">
          {children}
        </main>

      </body>
    </html>
  );
}