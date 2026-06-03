import { useEffect, useRef, useState, useCallback } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

const WS_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

export function useWebSocket(salaId, onNumero, onEstado, onPremio, onJugador) {
  const clientRef = useRef(null);
  const [conectado, setConectado] = useState(false);

  const conectar = useCallback(() => {
    const token = localStorage.getItem('token');

    const client = new Client({
      webSocketFactory: () => new SockJS(`${WS_URL}/ws`),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,

      onConnect: () => {
        setConectado(true);

        // Suscribirse a números sorteados
        client.subscribe(`/topic/sala/${salaId}/numero`, (msg) => {
          const data = JSON.parse(msg.body);
          onNumero && onNumero(data);
        });

        // Suscribirse a cambios de estado
        client.subscribe(`/topic/sala/${salaId}/estado`, (msg) => {
          const data = JSON.parse(msg.body);
          onEstado && onEstado(data);
        });

        // Suscribirse a premios ganados
        client.subscribe(`/topic/sala/${salaId}/premios`, (msg) => {
          const data = JSON.parse(msg.body);
          onPremio && onPremio(data);
        });

        // Suscribirse a jugadores conectados
        client.subscribe(`/topic/sala/${salaId}/jugadores`, (msg) => {
          const data = JSON.parse(msg.body);
          onJugador && onJugador(data);
        });
      },

      onDisconnect: () => setConectado(false),
      onStompError: (frame) => console.error('STOMP error:', frame),
    });

    client.activate();
    clientRef.current = client;
  }, [salaId]);

  const desconectar = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.deactivate();
      clientRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (salaId) conectar();
    return () => desconectar();
  }, [salaId, conectar, desconectar]);

  return { conectado, desconectar };
}
