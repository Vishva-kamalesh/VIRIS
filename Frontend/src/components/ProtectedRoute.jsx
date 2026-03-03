import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, role } = useSelector((s) => s.auth);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(role)) return <Navigate to="/login" replace />;

  return children;
}
