import { useEffect, useRef, useState, useCallback } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

const WS_URL = (process.env.REACT_APP_API_URL || 'http://localhost:8080').replace(/\/$/, '');

export function useWebSocket(salaId, onNumero, onEstado, onPremio, onJugador) {
  const clientRef = useRef(null);
  const [conectado, setConectado] = useState(false);

  useEffect(() => {
    if (!salaId) return;

    const token = localStorage.getItem('token');

    const client = new Client({
      webSocketFactory: () => new SockJS(`${WS_URL}/ws`),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        setConectado(true);
        console.log('WebSocket conectado a sala', salaId);

        client.subscribe(`/topic/sala/${salaId}/numero`, (msg) => {
          onNumero && onNumero(JSON.parse(msg.body));
        });
        client.subscribe(`/topic/sala/${salaId}/estado`, (msg) => {
          onEstado && onEstado(JSON.parse(msg.body));
        });
        client.subscribe(`/topic/sala/${salaId}/premios`, (msg) => {
          onPremio && onPremio(JSON.parse(msg.body));
        });
        client.subscribe(`/topic/sala/${salaId}/jugadores`, (msg) => {
          onJugador && onJugador(JSON.parse(msg.body));
        });
      },
      onDisconnect: () => {
        setConectado(false);
        console.log('WebSocket desconectado');
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame);
      },
      onWebSocketError: (error) => {
        console.error('WebSocket error:', error);
      }
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
    };
  }, [salaId]);

  return { conectado };
}