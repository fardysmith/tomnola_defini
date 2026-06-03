import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('usuario');
    if (token && userData) {
      setUsuario(JSON.parse(userData));
    }
    setCargando(false);
  }, []);

  const login = (data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('usuario', JSON.stringify({
      id: data.id,
      username: data.username,
      email: data.email,
      rol: data.rol,
    }));
    setUsuario({ id: data.id, username: data.username, email: data.email, rol: data.rol });
  };

  const logout = () => {
    localStorage.clear();
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, login, logout, cargando }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
