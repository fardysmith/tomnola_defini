import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Dashboard() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [salas, setSalas] = useState([]);
  const [codigo, setCodigo] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarSalas();
    const interval = setInterval(cargarSalas, 5000); // refresca cada 5s
    return () => clearInterval(interval);
  }, []);

  const cargarSalas = async () => {
    try {
      const { data } = await api.get('/api/salas/activas');
      setSalas(data);
    } catch (e) {
      console.error('Error cargando salas', e);
    }
  };

  const unirseASala = async (salaId) => {
    setCargando(true);
    setError('');
    try {
      await api.post(`/api/salas/${salaId}/unirse`);
      navigate(`/juego/${salaId}`);
    } catch (e) {
      setError(e.response?.data?.mensaje || 'No se pudo unir a la sala');
    } finally {
      setCargando(false);
    }
  };

  const unirsePorCodigo = async () => {
    if (!codigo.trim()) return;
    setCargando(true);
    setError('');
    try {
      const { data } = await api.post(`/api/salas/unirse/${codigo.trim().toUpperCase()}`);
      navigate(`/juego/${data.id}`);
    } catch (e) {
      setError(e.response?.data?.mensaje || 'Código inválido');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="dashboard-page" style={{ minHeight: '100vh', background: '#0E0618', padding: '0' }}>
      {/* Navbar */}
      <nav style={{ background: '#1A0A2E', borderBottom: '0.5px solid #3D1F6E', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 60px', height: '64px' }}>
        <div style={{ fontFamily: 'Cinzel, serif', fontSize: '20px', fontWeight: '900', color: '#F5E6FF', letterSpacing: '4px' }}>
          TOMBO<span style={{ color: '#C084FC' }}>LA</span>
        </div>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', color: '#9B72CC' }}>Hola, <strong style={{ color: '#C084FC' }}>{usuario?.username}</strong></span>
          {usuario?.rol === 'ADMIN' && (
            <button onClick={() => navigate('/admin')} style={{ padding: '8px 16px', background: 'transparent', border: '0.5px solid #7C3AED', borderRadius: '8px', color: '#C084FC', cursor: 'pointer', fontSize: '12px' }}>
              Panel Admin
            </button>
          )}
          <button onClick={() => { logout(); navigate('/login'); }} style={{ padding: '8px 16px', background: 'transparent', border: '0.5px solid #4A2880', borderRadius: '8px', color: '#7C5AA8', cursor: 'pointer', fontSize: '12px' }}>
            Salir
          </button>
        </div>
      </nav>

      <div style={{ padding: '48px 60px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <div style={{ fontSize: '14px', color: '#7C5AA8', marginBottom: '6px' }}>Hola de nuevo,</div>
            <div style={{ fontFamily: 'Cinzel, serif', fontSize: '30px', color: '#F5E6FF' }}>{usuario?.username}</div>
          </div>
        </div>

        {error && (
          <div style={{ background: 'rgba(248,113,113,0.1)', border: '0.5px solid #F87171', borderRadius: '8px', padding: '12px 16px', color: '#F87171', fontSize: '14px', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        {/* Salas activas */}
        <div style={{ fontSize: '11px', color: '#7C5AA8', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: '16px' }}>
          Salas disponibles
        </div>

        {salas.length === 0 ? (
          <div style={{ background: '#1A0A2E', border: '0.5px solid #3D1F6E', borderRadius: '14px', padding: '40px', textAlign: 'center', color: '#7C5AA8', marginBottom: '32px' }}>
            No hay salas disponibles en este momento
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '40px' }}>
            {salas.map(sala => (
              <div key={sala.id} style={{ background: '#1A0A2E', border: '0.5px solid #3D1F6E', borderRadius: '14px', padding: '28px' }}>
                <div style={{ fontFamily: 'Cinzel, serif', fontSize: '18px', color: '#F5E6FF', marginBottom: '8px' }}>{sala.nombre}</div>
                <div style={{ fontSize: '13px', color: '#7C5AA8', marginBottom: '8px' }}>Código: <strong style={{ color: '#C084FC' }}>{sala.codigo}</strong></div>
                <div style={{ fontSize: '13px', color: '#7C5AA8', marginBottom: '20px' }}>Máx. jugadores: {sala.maxJugadores}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', padding: '5px 12px', borderRadius: '12px', background: '#0d2b0d', color: '#4ade80', fontWeight: '600' }}>
                    Esperando
                  </span>
                  <button
                    onClick={() => unirseASala(sala.id)}
                    disabled={cargando}
                    style={{ padding: '8px 20px', background: '#7C3AED', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px', fontFamily: 'Cinzel, serif', cursor: 'pointer' }}
                  >
                    Unirse
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Unirse por código */}
        <div style={{ fontSize: '11px', color: '#7C5AA8', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: '16px' }}>
          Unirse por código
        </div>
        <div style={{ display: 'flex', gap: '16px', maxWidth: '500px' }}>
          <input
            value={codigo}
            onChange={e => setCodigo(e.target.value.toUpperCase())}
            placeholder="Código de sala (ej: ABC123)"
            maxLength={6}
            style={{ flex: 1, padding: '13px 20px', background: '#1A0A2E', border: '0.5px solid #3D1F6E', borderRadius: '10px', color: '#E8D8FF', fontSize: '14px', fontFamily: 'Crimson Pro, serif', outline: 'none' }}
          />
          <button
            onClick={unirsePorCodigo}
            disabled={cargando || !codigo.trim()}
            style={{ padding: '13px 28px', background: '#7C3AED', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '13px', fontFamily: 'Cinzel, serif', cursor: 'pointer' }}
          >
            Entrar
          </button>
        </div>
      </div>
    </div>
  );
}
