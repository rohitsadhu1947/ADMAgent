'use client';
import { useAuth } from '@/lib/AuthContext';
import AdminDashboard from '@/components/dashboards/AdminDashboard';
import ADMDashboard from '@/components/dashboards/ADMDashboard';

export default function DashboardPage() {
  const { isAdmin } = useAuth();
  return isAdmin ? <AdminDashboard /> : <ADMDashboard />;
}
