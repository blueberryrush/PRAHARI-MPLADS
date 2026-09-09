import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext();

const demoUsers = {
  citizen: { name: 'Rajesh Kumar', email: 'citizen@demo.com', role: 'citizen', constituency: 'Varanasi', state: 'Uttar Pradesh' },
  district_authority: { name: 'Dr. Priya Sharma', email: 'da@demo.com', role: 'district_authority', constituency: 'Varanasi', state: 'Uttar Pradesh', district: 'Varanasi' },
  state_nodal: { name: 'Amit Singh', email: 'state@demo.com', role: 'state_nodal', state: 'Uttar Pradesh' },
  ministry: { name: 'Sunita Verma', email: 'ministry@demo.com', role: 'ministry' },
  mp: { name: 'Hon. Sh. Vikram Patel', email: 'mp@demo.com', role: 'mp', constituency: 'Varanasi', state: 'Uttar Pradesh' },
};

const roleLabels = {
  citizen: 'Citizen',
  district_authority: 'District Authority',
  state_nodal: 'State Nodal Authority',
  ministry: 'Ministry Official',
  mp: 'Member of Parliament',
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('mplads-user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = useCallback((email, password, role = 'citizen') => {
    // Simulated login - accept any email with "demo123" password
    const demoUser = demoUsers[role] || demoUsers.citizen;
    const loggedInUser = { ...demoUser, email: email || demoUser.email, role };
    setUser(loggedInUser);
    localStorage.setItem('mplads-user', JSON.stringify(loggedInUser));
    return { success: true, user: loggedInUser };
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
    localStorage.removeItem('mplads-user');
  }, []);

  const isOfficial = user && user.role !== 'citizen';
  const isCitizen = user && user.role === 'citizen';
  const getRoleLabel = (role) => roleLabels[role] || role;

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isOfficial, isCitizen, getRoleLabel }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
