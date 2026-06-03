import { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = api.getToken();
      if (token) {
        try {
          const profile = await api.auth.me();
          setUser(profile);
        } catch (error) {
          console.error('Failed to restore authentication session:', error.message);
          api.clearToken();
          setUser(null);
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, []);

  const login = async (emailOrUsername, password) => {
    setLoading(true);
    try {
      const data = await api.auth.login(emailOrUsername, password);
      api.setToken(data.token);
      setUser({ _id: data._id, username: data.username, email: data.email });
      return data;
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (username, email, password) => {
    setLoading(true);
    try {
      const data = await api.auth.register(username, email, password);
      api.setToken(data.token);
      setUser({ _id: data._id, username: data.username, email: data.email });
      return data;
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    api.clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
