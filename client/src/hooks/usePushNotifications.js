import { useState, useEffect, useCallback } from 'react';
import { subscribeToPush, unsubscribeFromPush } from '../api/push';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

const usePushNotifications = () => {
  const isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
  const [permission, setPermission] = useState(isSupported ? Notification.permission : 'unsupported');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isSupported) return;
    const checkExisting = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        const existing = await registration.pushManager.getSubscription();
        setSubscribed(!!existing);
      } catch {
        // service worker registration can fail on http (non-localhost)
        // or unsupported setups — leave subscribed as false silently
      }
    };
    checkExisting();
  }, [isSupported]);

  const subscribe = useCallback(async () => {
    if (!isSupported) return false;
    setLoading(true);
    try {
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);
      if (permissionResult !== 'granted') return false;

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      await subscribeToPush(subscription.toJSON());
      setSubscribed(true);
      return true;
    } catch (err) {
      console.error('Push subscribe failed:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [isSupported]);

  const unsubscribe = useCallback(async () => {
    if (!isSupported) return;
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await unsubscribeFromPush(subscription.endpoint);
        await subscription.unsubscribe();
      }
      setSubscribed(false);
    } catch (err) {
      console.error('Push unsubscribe failed:', err);
    } finally {
      setLoading(false);
    }
  }, [isSupported]);

  return { isSupported, permission, subscribed, loading, subscribe, unsubscribe };
};

export default usePushNotifications;
