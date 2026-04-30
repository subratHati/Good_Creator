// import { createContext, useState, useEffect } from 'react';
// import { getMe } from '../api/auth';

// export const AuthContext = createContext(null);

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [token, setToken] = useState(localStorage.getItem('token'));
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const initAuth = async () => {
//       const storedToken = localStorage.getItem('token');
//       if (storedToken) {
//         try {
//           const res = await getMe();
//           setUser(res.data.user);
//         } catch (error) {
//           localStorage.removeItem('token');
//           localStorage.removeItem('user');
//           setUser(null);
//         }
//       }
//       setLoading(false);
//     };
//     initAuth();
//   }, []);

//   const login = (userData, userToken) => {
//     localStorage.setItem('token', userToken);
//     localStorage.setItem('user', JSON.stringify(userData));
//     setToken(userToken);
//     setUser(userData);
//   };

//   const logout = () => {
//     localStorage.removeItem('token');
//     localStorage.removeItem('user');
//     setToken(null);
//     setUser(null);
//   };

//   return (
//     <AuthContext.Provider value={{ user, token, loading, login, logout }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };
import { createContext, useState } from 'react';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
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
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};