import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';

export default function Login() {
  const [form, setForm]     = useState({ email: '', password: '' });
  const [errores, setErrores] = useState({});
  const [alerta, setAlerta]  = useState(null);
  const [cargando, setCargando] = useState(false);

  const { login } = useAuth();
  const navigate  = useNavigate();

  const validar = () => {
    const e = {};
    if (!form.email) e.email = 'El email es obligatorio';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Email no válido';
    if (!form.password) e.password = 'La contraseña es obligatoria';
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
      const { data } = await authService.login(form.email, form.password);
      login(data);
      navigate(data.rol === 'ADMIN' ? '/admin' : '/dashboard');
    } catch (err) {
      const msg = err.response?.data?.mensaje || 'Error al iniciar sesión';
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

        {/* Logo */}
        <div className="auth-logo">
          <span className="auth-logo-icon">🎱</span>
          <div className="auth-logo-title">TOMBO<span>LA</span></div>
          <div className="auth-logo-sub">Variante italiana del Bingo</div>
        </div>

        <div className="auth-heading">Bienvenido de nuevo</div>
        <div className="auth-subheading">Inicia sesión para continuar jugando</div>

        {alerta && (
          <div className={`alert alert-${alerta.tipo}`}>{alerta.msg}</div>
        )}

        <form onSubmit={handleSubmit} noValidate>
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
                autoComplete="current-password"
              />
            </div>
            {errores.password && <span className="field-error">{errores.password}</span>}
          </div>

          <button type="submit" className="btn-primary" disabled={cargando}>
            {cargando && <span className="btn-spinner" />}
            {cargando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="divider">¿No tienes cuenta?</div>
        <Link to="/registro" style={{ textDecoration: 'none' }}>
          <button className="btn-link">Crear cuenta nueva</button>
        </Link>

        {/* Premios strip */}
        <div className="prizes-strip">
          {[['🎯','Ambo'],['🥉','Terna'],['🥈','Quaterna'],['🥇','Quintina'],['🏆','Tombola']].map(([ic,nm]) => (
            <div className="prize-item" key={nm}>
              <span>{ic}</span>
              <strong>{nm}</strong>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
