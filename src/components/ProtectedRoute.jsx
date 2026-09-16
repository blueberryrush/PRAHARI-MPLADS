import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

function AccessDenied({ role, portalAccess, requiredPortal }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const isCommandNeeded = requiredPortal === 'COMMAND_CENTER';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
        padding: '24px',
      }}
    >
      <div
        style={{
          maxWidth: 520,
          width: '100%',
          backgroundColor: '#11221D',
          border: '1px solid #2D5446',
          borderRadius: 20,
          padding: '32px 28px',
          color: '#FFFFFF',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1.5px solid rgba(239, 68, 68, 0.4)',
            color: '#EF4444',
            display: 'grid',
            placeItems: 'center',
            margin: '0 auto 16px',
          }}
        >
          <ShieldAlert size={28} />
        </div>

        <span
          style={{
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#F87171',
            display: 'block',
            marginBottom: 4,
          }}
        >
          Clearance Restriction Violation
        </span>

        <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 10px', color: '#FAFAF9' }}>
          {isCommandNeeded
            ? 'Level-1 Administrative Clearance Required'
            : 'Investigation Desk Clearance Required'}
        </h2>

        <p style={{ fontSize: 13, color: '#A8A29E', lineHeight: 1.5, margin: '0 0 20px' }}>
          {isCommandNeeded
            ? 'This workspace contains district-wide financial intelligence & executive priority powers reserved for District Command Authorities.'
            : 'This workspace contains ground evidence lockers and field verification tools reserved for designated Investigation Officers.'}
        </p>

        <div
          style={{
            backgroundColor: '#0B1713',
            border: '1px solid #1E3E35',
            borderRadius: 12,
            padding: '14px 16px',
            textAlign: 'left',
            fontSize: 12,
            marginBottom: 24,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
          }}
        >
          <div>
            <span style={{ color: '#6B7280', fontSize: 10, display: 'block' }}>YOUR CURRENT ROLE</span>
            <strong style={{ color: '#34D399' }}>{role || 'Standard Official'}</strong>
          </div>
          <div>
            <span style={{ color: '#6B7280', fontSize: 10, display: 'block' }}>ASSIGNED CLEARANCE</span>
            <strong style={{ color: '#FBBF24' }}>{portalAccess || 'Limited'}</strong>
          </div>
          <div style={{ gridColumn: 'span 2', marginTop: 4, borderTop: '1px solid #1E3E35', paddingTop: 6 }}>
            <span style={{ color: '#6B7280', fontSize: 10, display: 'block' }}>RESTRICTED ROUTE</span>
            <span style={{ color: '#9CA3AF', fontFamily: 'monospace', fontSize: 11 }}>{location.pathname}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button
            type="button"
            onClick={() => navigate('/')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '10px 16px',
              borderRadius: 10,
              backgroundColor: '#1E3E35',
              color: '#FFFFFF',
              border: '1px solid #2D5446',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={15} /> Return Home
          </button>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '10px 16px',
              borderRadius: 10,
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              color: '#FCA5A5',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <LogOut size={15} /> Switch Account
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProtectedRoute({
  children,
  requireAuth = true,
  requireOfficial = false,
  allowedPortal = null, // 'COMMAND_CENTER' | 'INVESTIGATION_CENTER'
  allowedRoles = null,
  redirectTo = '/?auth=citizen',
}) {
  const { user, isOfficial, isCommandOfficer, isInvestigationOfficer } = useAuth();
  const hasToken = typeof window !== 'undefined' && Boolean(localStorage.getItem('prahari_token'));

  if (requireAuth && (!user || !hasToken)) {
    return <Navigate to={redirectTo} replace />;
  }

  if (requireOfficial && !isOfficial) {
    return <Navigate to="/citizen" replace />;
  }

  // Check portal-specific clearance
  if (allowedPortal === 'COMMAND_CENTER' && !isCommandOfficer) {
    return (
      <AccessDenied
        role={user.designation || user.role}
        portalAccess={user.portal_access || 'INVESTIGATION_CENTER'}
        requiredPortal="COMMAND_CENTER"
      />
    );
  }

  if (allowedPortal === 'INVESTIGATION_CENTER' && !isInvestigationOfficer) {
    return (
      <AccessDenied
        role={user.designation || user.role}
        portalAccess={user.portal_access || 'COMMAND_CENTER'}
        requiredPortal="INVESTIGATION_CENTER"
      />
    );
  }

  if (allowedRoles && (!user.role || !allowedRoles.includes(user.role))) {
    return (
      <AccessDenied
        role={user.designation || user.role}
        portalAccess={user.portal_access}
        requiredPortal={allowedPortal}
      />
    );
  }

  return children;
}