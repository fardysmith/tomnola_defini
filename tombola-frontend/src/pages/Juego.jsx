import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../hooks/useWebSocket';
import api from '../services/api';

const PREMIOS = ['AMBO', 'TERNA', 'QUATERNA', 'QUINTINA', 'TOMBOLA'];
const PREMIO_LABELS = { AMBO: 'Ambo', TERNA: 'Terna', QUATERNA: 'Quaterna', QUINTINA: 'Quintina', TOMBOLA: '🏆 Tombola' };

export default function Juego() {
  const { salaId } = useParams();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [sala, setSala] = useState(null);
  const [carton, setCarton] = useState(null);
  const [numerosSorteados, setNumerosSorteados] = useState([]);
  const [ultimoNumero, setUltimoNumero] = useState(null);
  const [estado, setEstado] = useState('ESPERANDO');
  const [countdown, setCountdown] = useState(60);
  const [jugadores, setJugadores] = useState(0);
  const [notificacion, setNotificacion] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Cargar sala al montar
  useEffect(() => {
    const cargarSala = async () => {
      try {
        const { data } = await api.post(`/api/salas/${salaId}/unirse`);
        setSala(data);
        setCarton(data.miCarton);
        setNumerosSorteados(data.numerosSorteados || []);
        setEstado(data.estado);
        setJugadores(data.jugadoresConectados);
      } catch (e) {
        mostrarNotificacion(e.response?.data?.mensaje || 'Error al unirse', 'error');
        setTimeout(() => navigate('/dashboard'), 2000);
      } finally {
        setCargando(false);
      }
    };
    cargarSala();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salaId]);

  // Handlers WebSocket
  const onNumero = useCallback((data) => {
    setUltimoNumero(data.numero);
    setNumerosSorteados(prev => [...prev, data.numero]);
    mostrarNotificacion(`Número sorteado: ${data.numero}`, 'numero');
  }, []);

  const onEstado = useCallback((data) => {
    setEstado(data.estado);
    setCountdown(data.segundosRestantes);
    setJugadores(data.jugadoresConectados);
    if (data.estado === 'EN_JUEGO') mostrarNotificacion('¡La partida comenzó!', 'inicio');
    if (data.estado === 'FINALIZADA') mostrarNotificacion('Partida finalizada', 'fin');
  }, []);

  const onPremio = useCallback((data) => {
    const msg = data.valido
      ? `🎉 ${data.username} ganó ${PREMIO_LABELS[data.premio]}!`
      : `Premio inválido`;
    mostrarNotificacion(msg, data.valido ? 'premio' : 'error');

    // Actualizar premios en mi cartón
    if (data.cartonId === carton?.id && data.valido) {
      setCarton(prev => ({
        ...prev,
        [`premio${data.premio.charAt(0) + data.premio.slice(1).toLowerCase()}`]: true
      }));
    }
  }, [carton]);

  const onJugador = useCallback((data) => {
    setJugadores(data.totalJugadores);
  }, []);

  useWebSocket(salaId, onNumero, onEstado, onPremio, onJugador);

  const reclamarPremio = async (premio) => {
    if (!carton) return;
    try {
      const { data } = await api.post(`/api/salas/${salaId}/reclamar`, {
        cartonId: carton.id,
        premio
      });
      if (data.valido) {
        mostrarNotificacion(`¡${PREMIO_LABELS[premio]} válido! 🎉`, 'premio');
      } else {
        mostrarNotificacion(data.mensaje, 'error');
      }
    } catch (e) {
      mostrarNotificacion('Error al reclamar premio', 'error');
    }
  };

  const mostrarNotificacion = (msg, tipo) => {
    setNotificacion({ msg, tipo });
    setTimeout(() => setNotificacion(null), 3000);
  };

  const esMarcado = (num) => numerosSorteados.includes(num);

  if (cargando) return (
    <div style={{ minHeight: '100vh', background: '#0E0618', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C084FC', fontFamily: 'Cinzel, serif', fontSize: '18px', letterSpacing: '3px' }}>
      CARGANDO...
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0E0618' }}>
      {/* Navbar */}
      <nav style={{ background: '#1A0A2E', borderBottom: '0.5px solid #3D1F6E', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 60px', height: '64px' }}>
        <div style={{ fontFamily: 'Cinzel, serif', fontSize: '20px', fontWeight: '900', color: '#F5E6FF', letterSpacing: '4px' }}>
          TOMBO<span style={{ color: '#C084FC' }}>LA</span>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: '#9B72CC' }}>{sala?.nombre}</span>
          <span style={{ fontSize: '11px', padding: '5px 12px', borderRadius: '12px', background: estado === 'EN_JUEGO' ? '#0d2b0d' : estado === 'ESPERANDO' ? '#2b1f00' : '#1e0a40', color: estado === 'EN_JUEGO' ? '#4ade80' : estado === 'ESPERANDO' ? '#fbbf24' : '#C084FC', fontWeight: '600' }}>
            {estado === 'EN_JUEGO' ? 'En juego' : estado === 'ESPERANDO' ? 'Esperando' : 'Finalizada'}
          </span>
          <span style={{ fontSize: '13px', color: '#C084FC' }}>👥 {jugadores}</span>
          <button onClick={() => navigate('/dashboard')} style={{ padding: '8px 16px', background: 'transparent', border: '0.5px solid #4A2880', borderRadius: '8px', color: '#7C5AA8', cursor: 'pointer', fontSize: '12px' }}>
            Salir
          </button>
        </div>
      </nav>

      {/* Notificación */}
      {notificacion && (
        <div style={{ position: 'fixed', top: '80px', right: '24px', background: notificacion.tipo === 'premio' ? '#1a3a00' : notificacion.tipo === 'error' ? '#3a0000' : notificacion.tipo === 'numero' ? '#1A0A2E' : '#1a2a3a', border: `0.5px solid ${notificacion.tipo === 'premio' ? '#4ade80' : notificacion.tipo === 'error' ? '#F87171' : '#7C3AED'}`, borderRadius: '10px', padding: '14px 20px', color: '#F5E6FF', fontSize: '14px', zIndex: 1000, animation: 'slideIn 0.3s ease' }}>
          {notificacion.msg}
        </div>
      )}

      <div style={{ padding: '32px 60px' }}>
        {/* Cuenta regresiva */}
        {estado === 'ESPERANDO' && (
          <div style={{ background: '#1A0A2E', border: '0.5px solid #fbbf24', borderRadius: '14px', padding: '24px 32px', marginBottom: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: '12px', color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
              La partida comienza en
            </div>
            <div style={{ fontFamily: 'Cinzel, serif', fontSize: '48px', color: '#fbbf24', fontWeight: '700' }}>
              {countdown}s
            </div>
            <div style={{ fontSize: '13px', color: '#7C5AA8', marginTop: '8px' }}>
              {jugadores} jugador(es) conectados
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '28px' }}>
          {/* Columna principal */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Número actual */}
            {estado === 'EN_JUEGO' && (
              <div style={{ background: '#1A0A2E', border: '0.5px solid #3D1F6E', borderRadius: '14px', padding: '32px', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#7C5AA8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
                  Último número sorteado
                </div>
                <div style={{ width: '100px', height: '100px', background: '#7C3AED', borderRadius: '50%', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cinzel, serif', fontSize: '40px', color: '#fff', fontWeight: '700', border: '4px solid #C084FC' }}>
                  {ultimoNumero || '—'}
                </div>
                <div style={{ fontSize: '13px', color: '#7C5AA8' }}>
                  Sorteados: {numerosSorteados.length} / 90
                </div>
              </div>
            )}

            {/* Cartón */}
            {carton && (
              <div style={{ background: '#1A0A2E', border: '0.5px solid #3D1F6E', borderRadius: '14px', padding: '28px' }}>
                <div style={{ fontSize: '12px', color: '#7C5AA8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
                  Tu cartón
                </div>
                {carton.filas.map((fila, fi) => (
                  <div key={fi} style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: '6px', marginBottom: '6px' }}>
                    {/* Generar 9 columnas con números o vacío */}
                    {Array.from({ length: 9 }, (_, col) => {
                      const inicio = col === 0 ? 1 : col * 10;
                      const fin = col === 8 ? 90 : col * 10 + 9;
                      const numEnCol = fila.find(n => n >= inicio && n <= fin);
                      const marcado = numEnCol && esMarcado(numEnCol);
                      const ultimo = numEnCol === ultimoNumero;
                      return (
                        <div key={col} style={{
                          aspectRatio: '1', background: !numEnCol ? '#1A0A2E' : ultimo ? '#C084FC' : marcado ? '#7C3AED' : '#2C1654',
                          borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '13px', fontWeight: '600',
                          color: !numEnCol ? 'transparent' : ultimo ? '#1A0A2E' : marcado ? '#fff' : '#C084FC',
                          border: `0.5px solid ${!numEnCol ? 'transparent' : ultimo ? '#C084FC' : marcado ? '#7C3AED' : '#4A2880'}`
                        }}>
                          {numEnCol || ''}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}

            {/* Botones de reclamar */}
            {estado === 'EN_JUEGO' && carton && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
                {PREMIOS.map(premio => {
                  const key = `premio${premio.charAt(0) + premio.slice(1).toLowerCase()}`;
                  const ganado = carton[key];
                  return (
                    <button
                      key={premio}
                      onClick={() => reclamarPremio(premio)}
                      disabled={ganado}
                      style={{ padding: '12px 8px', background: ganado ? '#1a3a00' : '#7C3AED', border: ganado ? '0.5px solid #4ade80' : 'none', borderRadius: '10px', color: ganado ? '#4ade80' : '#fff', fontFamily: 'Cinzel, serif', fontSize: '11px', letterSpacing: '1px', cursor: ganado ? 'default' : 'pointer' }}
                    >
                      {ganado ? '✓ ' : ''}{PREMIO_LABELS[premio]}
                    </button>
                  );
                })}
              </div>
            )}

            {estado === 'FINALIZADA' && (
              <div style={{ background: '#1A0A2E', border: '0.5px solid #C084FC', borderRadius: '14px', padding: '32px', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>🏆</div>
                <div style={{ fontFamily: 'Cinzel, serif', fontSize: '20px', color: '#F5E6FF', marginBottom: '8px' }}>Partida finalizada</div>
                <button onClick={() => navigate('/dashboard')} style={{ marginTop: '16px', padding: '12px 28px', background: '#7C3AED', border: 'none', borderRadius: '10px', color: '#fff', fontFamily: 'Cinzel, serif', fontSize: '13px', cursor: 'pointer' }}>
                  Volver al inicio
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Premios */}
            <div style={{ background: '#1A0A2E', border: '0.5px solid #3D1F6E', borderRadius: '14px', padding: '24px' }}>
              <div style={{ fontSize: '12px', color: '#7C5AA8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
                Premios
              </div>
              {PREMIOS.map(premio => {
                const key = `premio${premio.charAt(0) + premio.slice(1).toLowerCase()}`;
                const ganado = carton?.[key];
                return (
                  <div key={premio} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: ganado ? '#1a1000' : '#0E0618', borderRadius: '8px', border: `0.5px solid ${ganado ? '#fbbf24' : '#2C1654'}`, marginBottom: '8px' }}>
                    <div>
                      <div style={{ fontSize: '14px', color: '#E8D8FF' }}>{PREMIO_LABELS[premio]}</div>
                      <div style={{ fontSize: '11px', color: '#7C5AA8' }}>
                        {premio === 'AMBO' ? '2 en fila' : premio === 'TERNA' ? '3 en fila' : premio === 'QUATERNA' ? '4 en fila' : premio === 'QUINTINA' ? '5 en fila' : 'Cartón completo'}
                      </div>
                    </div>
                    <span style={{ fontSize: '16px', color: ganado ? '#fbbf24' : '#4A2880' }}>
                      {ganado ? '✓' : '○'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Números sorteados */}
            <div style={{ background: '#1A0A2E', border: '0.5px solid #3D1F6E', borderRadius: '14px', padding: '24px' }}>
              <div style={{ fontSize: '12px', color: '#7C5AA8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
                Números sorteados ({numerosSorteados.length})
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {numerosSorteados.map(n => (
                  <span key={n} style={{ width: '32px', height: '32px', background: '#7C3AED', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: '#fff', fontWeight: '600' }}>
                    {n}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
