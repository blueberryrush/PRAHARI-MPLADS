import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext();

const demoUsers = {
  citizen: { name: 'Rajesh Kumar', email: 'citizen@prahari.gov.in', role: 'citizen', constituency: 'Varanasi', state: 'Uttar Pradesh', portal_access: 'CITIZEN' },
  district_authority: { name: 'DM Varanasi', email: 'dm.varanasi@prahari.gov.in', role: 'district_authority', designation: 'District Magistrate', department: 'District Administration', portal_access: 'COMMAND_CENTER', constituency: 'Varanasi', state: 'Uttar Pradesh', district: 'Varanasi' },
  state_nodal: { name: 'Amit Singh', email: 'state@demo.com', role: 'state_nodal', state: 'Uttar Pradesh' },
  ministry: { name: 'Sunita Verma', email: 'ministry@demo.com', role: 'ministry' },
  mp: { name: 'Hon. Sh. Vikram Patel', email: 'mp@demo.com', role: 'mp', constituency: 'Varanasi', state: 'Uttar Pradesh' },
  investigator: { name: 'AE Priya Singh', email: 'ae.priyasingh@prahari.gov.in', role: 'investigator', designation: 'Assistant Engineer', department: 'Rural Engineering Services', portal_access: 'INVESTIGATION_CENTER', constituency: 'Varanasi', state: 'Uttar Pradesh', district: 'Varanasi' },
};

const roleLabels = {
  citizen: 'Citizen',
  district_authority: 'District Authority',
  investigator: 'Investigator / Field Officer',
  state_nodal: 'State Nodal Authority',
  ministry: 'Ministry Official',
  mp: 'Member of Parliament',
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('prahari_token') || null);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('mplads-user');
    return saved ? JSON.parse(saved) : null;
  });

  const setAuthOfficer = useCallback((officer, authToken) => {
    if (!officer) return;
    const formattedUser = {
      id: officer.id,
      name: officer.name,
      email: officer.email,
      designation: officer.designation,
      department: officer.department,
      portal_access: officer.portal_access,
      role: officer.portal_access === 'COMMAND_CENTER' ? 'district_authority' : 'investigator',
      state: officer.state || 'Uttar Pradesh',
      district: officer.district || 'Varanasi',
      constituency: officer.district || 'Varanasi',
      govt_id_number: officer.govt_id_number,
      id_proof_url: officer.id_proof_url,
    };

    setUser(formattedUser);
    localStorage.setItem('mplads-user', JSON.stringify(formattedUser));

    if (authToken) {
      setToken(authToken);
      localStorage.setItem('prahari_token', authToken);
    }
  }, []);

  const login = useCallback((email, password, role = 'citizen') => {
    // Simulated login fallback for citizen demo mode & instant access
    const demoUser = demoUsers[role] || demoUsers.citizen;
    const loggedInUser = { ...demoUser, email: email || demoUser.email, role };
    setUser(loggedInUser);
    localStorage.setItem('mplads-user', JSON.stringify(loggedInUser));
    const sessionToken = `prahari_token_${role}_${Date.now()}`;
    setToken(sessionToken);
    localStorage.setItem('prahari_token', sessionToken);
    return { success: true, user: loggedInUser, token: sessionToken };
  }, []);

  const signup = useCallback((userData) => {
    const newUser = {
      name: userData.name,
      email: userData.email,
      role: userData.role || 'citizen',
      constituency: userData.constituency,
      state: userData.state,
      district: userData.district,
    };
    setUser(newUser);
    localStorage.setItem('mplads-user', JSON.stringify(newUser));
    return { success: true, user: newUser };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('mplads-user');
    localStorage.removeItem('prahari_token');
  }, []);

  const isOfficial = user && user.role !== 'citizen';
  const isCitizen = user && user.role === 'citizen';
  const isCommandOfficer = user && (user.portal_access === 'COMMAND_CENTER' || user.role === 'district_authority');
  const isInvestigationOfficer = user && (user.portal_access === 'INVESTIGATION_CENTER' || user.role === 'investigator');

  const hasClearance = useCallback((requiredPortal) => {
    if (!user) return false;
    if (!requiredPortal) return true;
    if (requiredPortal === 'COMMAND_CENTER') {
      return user.portal_access === 'COMMAND_CENTER' || user.role === 'district_authority';
    }
    if (requiredPortal === 'INVESTIGATION_CENTER') {
      return user.portal_access === 'INVESTIGATION_CENTER' || user.role === 'investigator';
    }
    return true;
  }, [user]);

  const getRoleLabel = (role) => roleLabels[role] || role;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        setAuthOfficer,
        login,
        signup,
        logout,
        isOfficial,
        isCitizen,
        isCommandOfficer,
        isInvestigationOfficer,
        hasClearance,
        getRoleLabel,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
