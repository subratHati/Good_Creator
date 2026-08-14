import { createContext, useState } from 'react';
import { usePostHog } from '@posthog/react';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const posthog = usePostHog();

  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(() => {
    return localStorage.getItem('token') || null;
  });

  // no loading needed anymore — state is initialized synchronously
  const loading = false;

  const login = (userData, userToken) => {
    localStorage.setItem('token', userToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(userToken);
    setUser(userData);

    // ties all future events to this specific logged-in user, instead of
    // an anonymous browser session — this is what makes DAU/MAU counts
    // accurate across devices/browsers for the same real person
    posthog.identify(userData._id || userData.id, {
      email: userData.email,
      role: userData.role,
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);

    // clears PostHog's association with this user, so any further
    // activity in this browser (e.g. someone else logging in) starts
    // as a fresh anonymous session rather than being attributed to the
    // person who just logged out
    posthog.reset();
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};