
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/auth';

const ProtectedRoute = () => {
  const { session, loading } = useAuth();
  const location = useLocation();

  console.log('ProtectedRoute: Current state', { sessionExists: !!session, loading, pathname: location.pathname });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-3">Loading authentication...</span>
        </div>
      </div>
    );
  }

  if (!session) {
    console.log('ProtectedRoute: No session, redirecting to auth');
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  console.log('ProtectedRoute: Session found, rendering protected content');
  return <Outlet />;
};

export default ProtectedRoute;
