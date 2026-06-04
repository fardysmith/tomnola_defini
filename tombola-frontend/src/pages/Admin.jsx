import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Admin() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [salas, setSalas] = useState([]);
  const [form, setForm] = useState({ nombre: '', maxJugadores: 16, tiempoEsperaSegundos: 60, intervaloSorteoSegundos: 5 });
  const [creando, setCreando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  useEffect(() => {
    cargarSalas();
    const interval = setInterval(cargarSalas, 3000);
    return () => clearInterval(interval);
  }, []);

  const cargarSalas = async () => {
    try {
      const { data } = await api.get('/api/salas');
      console.log('Salas recibidas:', data);
      if (Array.isArray(data)) {
        setSalas(data);
      } else {
        console.error('Data no es array:', data);
        setSalas([]);
      }
    } catch (e) {
      console.error('Error cargando salas:', e);
      setSalas([]);
    }
  };

  const crearSala = async () => {
    if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return; }
    setCreando(true); setError(''); setExito('');
    try {
      await api.post('/api/salas', form);
      setExito('Sala creada exitosamente');
      setForm({ nombre: '', maxJugadores: 16, tiempoEsperaSegundos: 60, intervaloSorteoSegundos: 5 });
      cargarSalas();
    } catch (e) {
      setError(e.response?.data?.mensaje || 'Error al crear sala');
    } finally { setCreando(false); }
  };

  const badgeColor = (estado) => {
    if (estado === 'EN_JUEGO') return { bg: '#0d2b0d', color: '#4ade80' };
    if (estado === 'ESPERANDO') return { bg: '#2b1f00', color: '#fbbf24' };
    return { bg: '#1e0a40', color: '#C084FC' };
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0E0618' }}>
      {/* Navbar */}
      <nav style={{ background: '#1A0A2E', borderBottom: '0.5px solid #3D1F6E', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 60px', height: '64px' }}>
        <div style={{ fontFamily: 'Cinzel, serif', fontSize: '20px', fontWeight: '900', color: '#F5E6FF', letterSpacing: '4px' }}>
          TOMBO<span style={{ color: '#C084FC' }}>LA</span>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', padding: '5px 12px', borderRadius: '12px', background: '#1e0a40', color: '#C084FC', border: '0.5px solid #7C3AED', fontWeight: '600' }}>ADMIN</span>
          <button onClick={() => navigate('/dashboard')} style={{ padding: '8px 16px', background: 'transparent', border: '0.5px solid #4A2880', borderRadius: '8px', color: '#7C5AA8', cursor: 'pointer', fontSize: '12px' }}>Dashboard</button>
          <button onClick={() => { logout(); navigate('/login'); }} style={{ padding: '8px 16px', background: 'transparent', border: '0.5px solid #4A2880', borderRadius: '8px', color: '#7C5AA8', cursor: 'pointer', fontSize: '12px' }}>Salir</button>
        </div>
      </nav>

      <div style={{ padding: '40px 60px', display: 'grid', gridTemplateColumns: '320px 1fr', gap: '28px' }}>
        {/* Sidebar crear sala */}
        <div>
          <div style={{ background: '#1A0A2E', border: '0.5px solid #3D1F6E', borderRadius: '14px', padding: '28px' }}>
            <div style={{ fontFamily: 'Cinzel, serif', fontSize: '16px', color: '#F5E6FF', marginBottom: '20px' }}>Nueva sala</div>

            {error && <div style={{ background: 'rgba(248,113,113,0.1)', border: '0.5px solid #F87171', borderRadius: '8px', padding: '10px 14px', color: '#F87171', fontSize: '13px', marginBottom: '16px' }}>{error}</div>}
            {exito && <div style={{ background: 'rgba(74,222,128,0.1)', border: '0.5px solid #4ade80', borderRadius: '8px', padding: '10px 14px', color: '#4ade80', fontSize: '13px', marginBottom: '16px' }}>{exito}</div>}

            {[
              { label: 'Nombre de la sala', key: 'nombre', type: 'text', placeholder: 'Sala Roma' },
              { label: 'Máx. jugadores', key: 'maxJugadores', type: 'number', placeholder: '16' },
              { label: 'Tiempo espera (seg)', key: 'tiempoEsperaSegundos', type: 'number', placeholder: '60' },
              { label: 'Intervalo sorteo (seg)', key: 'intervaloSorteoSegundos', type: 'number', placeholder: '5' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '11px', color: '#7C5AA8', letterSpacing: '1px', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>{f.label}</label>
                <input
                  type={f.type}
                  value={form[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: f.type === 'number' ? parseInt(e.target.value) : e.target.value }))}
                  placeholder={f.placeholder}
                  style={{ width: '100%', padding: '11px 14px', background: '#2C1654', border: '0.5px solid #4A2880', borderRadius: '9px', color: '#E8D8FF', fontSize: '14px', fontFamily: 'Crimson Pro, serif', outline: 'none' }}
                />
              </div>
            ))}

            <button
              onClick={crearSala}
              disabled={creando}
              style={{ width: '100%', padding: '13px', background: '#7C3AED', border: 'none', borderRadius: '10px', color: '#fff', fontFamily: 'Cinzel, serif', fontSize: '13px', letterSpacing: '2px', cursor: 'pointer', marginTop: '4px' }}
            >
              {creando ? 'CREANDO...' : 'CREAR SALA'}
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
            {[
              { num: salas.filter(s => s.estado === 'EN_JUEGO').length, lbl: 'En juego' },
              { num: salas.filter(s => s.estado === 'ESPERANDO').length, lbl: 'Esperando' },
              { num: salas.filter(s => s.estado === 'FINALIZADA').length, lbl: 'Finalizadas' },
              { num: salas.length, lbl: 'Total salas' },
            ].map(s => (
              <div key={s.lbl} style={{ background: '#1A0A2E', border: '0.5px solid #3D1F6E', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'Cinzel, serif', fontSize: '28px', color: '#C084FC' }}>{s.num}</div>
                <div style={{ fontSize: '11px', color: '#7C5AA8', textTransform: 'uppercase', letterSpacing: '0.8px', marginTop: '4px' }}>{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabla de salas */}
        <div>
          <div style={{ background: '#1A0A2E', border: '0.5px solid #3D1F6E', borderRadius: '14px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 28px', borderBottom: '0.5px solid #3D1F6E' }}>
              <span style={{ fontFamily: 'Cinzel, serif', fontSize: '16px', color: '#F5E6FF' }}>Gestión de salas</span>
              <span style={{ fontSize: '12px', color: '#7C5AA8' }}>Actualización automática cada 3s</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Sala', 'Código', 'Estado', 'Sorteados', 'Creada', 'Acciones'].map(h => (
                    <th key={h} style={{ fontSize: '11px', color: '#7C5AA8', textTransform: 'uppercase', letterSpacing: '1px', padding: '12px 24px', textAlign: 'left', borderBottom: '0.5px solid #3D1F6E', fontWeight: '400' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {salas.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#7C5AA8', fontSize: '14px' }}>No hay salas creadas</td></tr>
                ) : salas.map(sala => {
                  const bc = badgeColor(sala.estado);
                  return (
                    <tr key={sala.id}>
                      <td style={{ fontSize: '14px', color: '#E8D8FF', padding: '14px 24px', borderBottom: '0.5px solid #2C1654' }}>{sala.nombre}</td>
                      <td style={{ fontSize: '13px', color: '#C084FC', padding: '14px 24px', borderBottom: '0.5px solid #2C1654', fontFamily: 'monospace', letterSpacing: '2px' }}>{sala.codigo}</td>
                      <td style={{ padding: '14px 24px', borderBottom: '0.5px solid #2C1654' }}>
                        <span style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '10px', background: bc.bg, color: bc.color, fontWeight: '600' }}>{sala.estado}</span>
                      </td>
                      <td style={{ fontSize: '13px', color: '#9B72CC', padding: '14px 24px', borderBottom: '0.5px solid #2C1654' }}>
                        {sala.numerosSorteadosList ? sala.numerosSorteadosList.length : 0}/90
                      </td>
                      <td style={{ fontSize: '12px', color: '#7C5AA8', padding: '14px 24px', borderBottom: '0.5px solid #2C1654' }}>
                        {sala.createdAt ? new Date(sala.createdAt).toLocaleTimeString() : '—'}
                      </td>
                      <td style={{ padding: '14px 24px', borderBottom: '0.5px solid #2C1654' }}>
                        <button
                          onClick={() => navigate(`/juego/${sala.id}`)}
                          style={{ fontSize: '11px', padding: '5px 12px', background: 'transparent', border: '0.5px solid #4A2880', borderRadius: '5px', color: '#9B72CC', cursor: 'pointer' }}
                        >
                          Ver
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
