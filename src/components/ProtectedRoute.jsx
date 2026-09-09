import { Navigate, useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

function AccessDenied({ role }) {
  const location = useLocation();

  return (
    <div className="access-denied-page">
      <div className="access-denied-card">

        <div className="access-denied-icon">
          <ShieldAlert size={28} />
        </div>

        <span className="eyebrow">ACCESS CONTROL</span>

        <h1>Access restricted</h1>

        <p>
          This workspace is not available for the current authority role.
          PRAHARI limits sensitive review actions according to jurisdiction
          and responsibility.
        </p>

        <div className="access-denied-context">
          <span>Current role</span>
          <strong>{role || 'Unknown'}</strong>

          <span>Requested workspace</span>
          <strong>{location.pathname}</strong>
        </div>

        <button onClick={() => window.history.back()}>
          Go back
        </button>

      </div>
    </div>
  );
}

export default function ProtectedRoute({
  children,
  requireOfficial = false,
  allowedRoles = null,
}) {
  const { user, isOfficial } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireOfficial && !isOfficial) {
    return <Navigate to="/citizen" replace />;
  }

  if (
    allowedRoles &&
    (!user.role || !allowedRoles.includes(user.role))
  ) {
    return <AccessDenied role={user.role} />;
  }

  return children;
}