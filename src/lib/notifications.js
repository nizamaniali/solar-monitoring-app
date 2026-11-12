import { supabase } from './supabase';

export async function registerForPushNotificationsAsync() {
  try {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return null;
    }

    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    if (permission !== 'granted') {
      console.log('Web notification permission was not granted.');
      return null;
    }

    const deviceName = `Web Browser (${navigator.platform || 'Desktop'})`;

    let browserToken = localStorage.getItem('@solar_monitor_web_device_id');
    if (!browserToken) {
      browserToken = `web-${crypto.randomUUID ? crypto.randomUUID() : Date.now()}`;
      localStorage.setItem('@solar_monitor_web_device_id', browserToken);
    }

    const { error } = await supabase.from('push_tokens').upsert(
      {
        token: browserToken,
        device_name: deviceName,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'token',
      }
    );

    if (error) {
      console.log('Note: push_tokens upsert skipped or failed:', error.message);
      return null;
    }

    return browserToken;
  } catch (error) {
    console.log('Web notification registration error:', error);
    return null;
  }
}
