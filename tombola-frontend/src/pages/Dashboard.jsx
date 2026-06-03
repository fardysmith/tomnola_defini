import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-page">
      <div style={{ fontSize: '3rem' }}>🎱</div>
      <h1>¡Bienvenido, {usuario?.username}!</h1>
      <p>Has iniciado sesión correctamente como <strong style={{ color: 'var(--lavender)' }}>{usuario?.rol}</strong>.</p>
      <p style={{ fontSize: '0.9rem', color: 'var(--violet)' }}>Dashboard en construcción...</p>
      <button className="btn-logout" onClick={handleLogout}>Cerrar sesión</button>
    </div>
  );
}
