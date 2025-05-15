import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [authToken, setAuthToken] = useState(localStorage.getItem('authToken'));
  const [user, setUser] = useState(null); // Placeholder for user info
  const navigate = useNavigate();

  useEffect(() => {
    if (authToken) {
      localStorage.setItem('authToken', authToken);
      // In a real app, you might want to fetch user details here
      // For now, we'll just assume login is valid if token exists
    } else {
      localStorage.removeItem('authToken');
    }
  }, [authToken]);

  const login = (token, userData = null) => {
    setAuthToken(token);
    setUser(userData);
    navigate('/');
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ authToken, user, login, logout, isAuthenticated: !!authToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);