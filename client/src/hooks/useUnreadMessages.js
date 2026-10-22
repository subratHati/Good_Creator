import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getUnreadCount } from '../api/chat';
import { getSupportUnreadCount } from '../api/assistant';

// One shared poller for everything that shows the Messages badge (Navbar + BottomNav),
// so the server is asked once per interval instead of once per component.
let count = 0;
let lastPoll = 0;
let timer = null;
const listeners = new Set();

const emit = () => listeners.forEach((fn) => fn(count));

const poll = async () => {
  if (document.hidden) return;
  const now = Date.now();
  if (now - lastPoll < 2000) return; // de-duplicate calls made at nearly the same moment
  lastPoll = now;
  const [chatRes, supportRes] = await Promise.allSettled([getUnreadCount(), getSupportUnreadCount()]);
  const val = (r) => (r.status === 'fulfilled' ? r.value.data.unreadCount || 0 : 0);
  count = val(chatRes) + val(supportRes);
  emit();
};

const onVisible = () => { if (!document.hidden) poll(); };

const start = () => {
  count = 0;
  poll();
  timer = setInterval(poll, 30000);
  document.addEventListener('visibilitychange', onVisible);
};

const stop = () => {
  clearInterval(timer);
  timer = null;
  document.removeEventListener('visibilitychange', onVisible);
  count = 0;
};

const useUnreadMessages = (enabled) => {
  const [value, setValue] = useState(count);
  const location = useLocation();

  useEffect(() => {
    if (!enabled) return;
    listeners.add(setValue);
    setValue(count);
    if (listeners.size === 1) start();
    return () => {
      listeners.delete(setValue);
      if (listeners.size === 0) stop();
    };
  }, [enabled]);

  // refresh right away when the user moves to another page (e.g. back from a chat)
  useEffect(() => {
    if (enabled) poll();
  }, [location.pathname, enabled]);

  return enabled ? value : 0;
};

export default useUnreadMessages;