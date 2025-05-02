import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import UserDashboard from '@/components/UserDashboard';

export const metadata: Metadata = {
  title: 'User Dashboard | Project Showcase',
  description: 'Manage your account and track your project purchases',
  openGraph: {
    title: 'User Dashboard | Project Showcase',
    description: 'Manage your account and track your project purchases',
    type: 'website',
  },
};

export default async function DashboardPage() {
  const session = await getServerSession();
  
  // Redirect to login page if user is not authenticated
  if (!session) {
    redirect('/api/auth/signin');
  }
  
  return (
    <div className="py-8 px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
      <UserDashboard />
    </div>
  );
}
