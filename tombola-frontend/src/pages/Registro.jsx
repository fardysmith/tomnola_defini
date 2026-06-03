import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';

function fortaleza(pwd) {
  if (!pwd) return { nivel: 0, color: '', texto: '' };
  let p = 0;
  if (pwd.length >= 6)  p++;
  if (pwd.length >= 10) p++;
  if (/[A-Z]/.test(pwd)) p++;
  if (/[0-9]/.test(pwd)) p++;
  if (/[^A-Za-z0-9]/.test(pwd)) p++;
  if (p <= 1) return { nivel: 20,  color: '#F87171', texto: 'Débil' };
  if (p <= 2) return { nivel: 45,  color: '#FBBF24', texto: 'Regular' };
  if (p <= 3) return { nivel: 70,  color: '#A78BFA', texto: 'Buena' };
  return              { nivel: 100, color: '#4ADE80', texto: 'Fuerte' };
}

export default function Registro() {
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmar: '' });
  const [errores, setErrores] = useState({});
  const [alerta, setAlerta]  = useState(null);
  const [cargando, setCargando] = useState(false);

  const { login } = useAuth();
  const navigate  = useNavigate();
  const fort = fortaleza(form.password);

  const validar = () => {
    const e = {};
    if (!form.username || form.username.length < 3)
      e.username = 'Mínimo 3 caracteres';
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email))
      e.email = 'Email no válido';
    if (!form.password || form.password.length < 6)
      e.password = 'Mínimo 6 caracteres';
    if (form.password !== form.confirmar)
      e.confirmar = 'Las contraseñas no coinciden';
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const e = validar();
    if (Object.keys(e).length) { setErrores(e); return; }
    setErrores({});
    setAlerta(null);
    setCargando(true);

    try {
      const { data } = await authService.registro(form.username, form.email, form.password);
      login(data);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.mensaje || 'Error al registrarse';
      setAlerta({ tipo: 'error', msg });
    } finally {
      setCargando(false);
    }
  };

  const set = (field) => (ev) => {
    setForm(f => ({ ...f, [field]: ev.target.value }));
    if (errores[field]) setErrores(e => ({ ...e, [field]: '' }));
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* Logo compacto */}
        <div className="auth-logo" style={{ marginBottom: '1.2rem' }}>
          <div className="auth-logo-title" style={{ fontSize: '1.5rem' }}>TOMBO<span>LA</span></div>
          <div className="auth-logo-sub">Crea tu cuenta</div>
        </div>

        <div className="auth-heading">Únete a la partida</div>
        <div className="auth-subheading">Regístrate y compite por la Tombola</div>

        {alerta && (
          <div className={`alert alert-${alerta.tipo}`}>{alerta.msg}</div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Username */}
          <div className="field">
            <label htmlFor="username">Nombre de jugador</label>
            <div className="field-wrap">
              <span className="field-icon">👤</span>
              <input
                id="username"
                type="text"
                placeholder="GiuseppeXL"
                value={form.username}
                onChange={set('username')}
                className={errores.username ? 'error' : ''}
                autoComplete="username"
              />
            </div>
            {errores.username && <span className="field-error">{errores.username}</span>}
          </div>

          {/* Email */}
          <div className="field">
            <label htmlFor="email">Email</label>
            <div className="field-wrap">
              <span className="field-icon">✉</span>
              <input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={form.email}
                onChange={set('email')}
                className={errores.email ? 'error' : ''}
                autoComplete="email"
              />
            </div>
            {errores.email && <span className="field-error">{errores.email}</span>}
          </div>

          {/* Contraseña */}
          <div className="field">
            <label htmlFor="password">Contraseña</label>
            <div className="field-wrap">
              <span className="field-icon">🔒</span>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={set('password')}
                className={errores.password ? 'error' : ''}
                autoComplete="new-password"
              />
            </div>
            {form.password && (
              <div className="strength-bar">
                <div className="strength-bar-fill"
                  style={{ width: `${fort.nivel}%`, background: fort.color }} />
              </div>
            )}
            {form.password && (
              <span style={{ fontSize: '0.72rem', color: fort.color, marginTop: '3px', display: 'block' }}>
                Fortaleza: {fort.texto}
              </span>
            )}
            {errores.password && <span className="field-error">{errores.password}</span>}
          </div>

          {/* Confirmar */}
          <div className="field">
            <label htmlFor="confirmar">Confirmar contraseña</label>
            <div className="field-wrap">
              <span className="field-icon">🔐</span>
              <input
                id="confirmar"
                type="password"
                placeholder="••••••••"
                value={form.confirmar}
                onChange={set('confirmar')}
                className={errores.confirmar ? 'error' : ''}
                autoComplete="new-password"
              />
            </div>
            {errores.confirmar && <span className="field-error">{errores.confirmar}</span>}
          </div>

          <button type="submit" className="btn-primary" disabled={cargando}>
            {cargando && <span className="btn-spinner" />}
            {cargando ? 'Registrando...' : 'Crear cuenta'}
          </button>
        </form>

        <div className="divider">¿Ya tienes cuenta?</div>
        <Link to="/login" style={{ textDecoration: 'none' }}>
          <button className="btn-link">Iniciar sesión</button>
        </Link>

      </div>
    </div>
  );
}
