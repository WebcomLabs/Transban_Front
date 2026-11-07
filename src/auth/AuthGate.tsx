import React, { useCallback, useEffect, useState } from 'react';
import App from '../App';
import { LoginPage } from '../pages/LoginPage';
import { getAccessToken, transbanApi } from '../services/api';

function hasSession() {
  return Boolean(getAccessToken());
}

export function AuthGate() {
  const [authed, setAuthed] = useState(hasSession);

  useEffect(() => {
    const signedIn = hasSession();
    setAuthed(signedIn);
    const path = window.location.pathname;
    if (!signedIn && path !== '/login') {
      window.history.replaceState({}, '', '/login');
    } else if (signedIn && path === '/login') {
      window.history.replaceState({}, '', '/');
    }

    const onPop = () => {
      const next = hasSession();
      setAuthed(next);
      if (!next && window.location.pathname !== '/login') {
        window.history.replaceState({}, '', '/login');
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const handleLogin = useCallback(() => {
    setAuthed(true);
    window.history.pushState({}, '', '/');
  }, []);

  const handleLogout = useCallback(() => {
    transbanApi.logout();
    setAuthed(false);
    window.history.pushState({}, '', '/login');
  }, []);

  if (!authed) return <LoginPage onSuccess={handleLogin} />;
  return <App onLogout={handleLogout} />;
}
