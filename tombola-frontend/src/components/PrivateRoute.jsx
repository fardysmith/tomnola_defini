import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PrivateRoute({ children, roles }) {
  const { usuario, cargando } = useAuth();

  if (cargando) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
      minHeight:'100vh', color:'var(--lavender)', fontFamily:'Cinzel,serif',
      fontSize:'1.2rem', letterSpacing:'3px' }}>
      CARGANDO...
    </div>
  );

  if (!usuario) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(usuario.rol)) return <Navigate to="/dashboard" replace />;

  return children;
}
