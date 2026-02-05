import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { useSessionStorage } from './hooks/useSessionStorage';
import { LoginScreen } from './components/Auth/LoginScreen';
import { Header } from './components/Layout/Header';
import { EmployeeDashboard } from './pages/EmployeeDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { SuperDashboard } from './pages/SuperDashboard';
import { Toaster } from './components/ui/sonner';

type Page = 'dashboard' | 'super-dashboard';

function App() {
  const [currentUserId, setCurrentUserId] = useSessionStorage<string | null>('currentUserId', null);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const users = useQuery(api.users.listUsers);
  const currentUser = users?.find(u => u._id === currentUserId);

  if (!currentUser) {
    return <LoginScreen setCurrentUserId={setCurrentUserId} />;
  }

  const isEmployee = currentUser.role === 'USER';

  return (
    <div className="min-h-screen app-background">
      <Header
        currentUser={currentUser}
        setCurrentUserId={setCurrentUserId}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />
      <main>
        {currentPage === 'super-dashboard' ? (
          <SuperDashboard currentUser={currentUser} />
        ) : (
          isEmployee ? <EmployeeDashboard currentUser={currentUser} /> : <AdminDashboard currentUser={currentUser} />
        )}
      </main>
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;
