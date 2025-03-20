
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/auth';

const ProtectedRoute = () => {
  const { session, loading } = useAuth();
  const location = useLocation();
  
  console.log('ProtectedRoute: Session state', { session, loading, path: location.pathname });

  if (loading) {
    console.log('ProtectedRoute: Still loading auth state');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-3">Loading authentication...</span>
      </div>
    );
  }

  if (!session) {
    console.log('ProtectedRoute: No session, redirecting to auth');
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  console.log('ProtectedRoute: Session exists, rendering protected content');
  return <Outlet />;
};

export default ProtectedRoute;
