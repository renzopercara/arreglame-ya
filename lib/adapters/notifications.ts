
export interface IPushMessage {
  id: string;
  title: string;
  body: string;
  data: any;
}

export type PushPermissionStatus = 'granted' | 'denied' | 'prompt';

export interface INotificationService {
  checkPermission(): Promise<PushPermissionStatus>;
  requestPermission(): Promise<boolean>;
  register(): Promise<void>;
  onRegistration(callback: (token: string) => void): void;
  onRegistrationError(callback: (error: any) => void): void;
  onMessageReceived(callback: (message: IPushMessage) => void): void;
  onActionPerformed(callback: (action: any) => void): void;
  removeAllListeners(): Promise<void>;
}

class WebNotificationAdapter implements INotificationService {
  async checkPermission(): Promise<PushPermissionStatus> {
    if (!('Notification' in window)) return 'denied';
    if (Notification.permission === 'default') return 'prompt';
    return Notification.permission as PushPermissionStatus;
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false;
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  async register(): Promise<void> {
    console.log('[WebPush] Simulando registro web...');
  }

  onRegistration(callback: (token: string) => void) {
    // Mock token for web dev
    setTimeout(() => callback('web-mock-token-' + Date.now()), 1000);
  }

  onRegistrationError(callback: (error: any) => void) {}
  onMessageReceived(callback: (message: IPushMessage) => void) {}
  onActionPerformed(callback: (action: any) => void) {}
  async removeAllListeners() {}
}

export const NotificationAdapter = new WebNotificationAdapter();
