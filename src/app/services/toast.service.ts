import { Injectable, inject } from '@angular/core';
import { ToastController, ToastOptions } from '@ionic/angular';

/**
 * Configuración personalizada para el toast
 */
export interface ToastConfig {
  message: string;
  duration?: number;
  position?: 'top' | 'bottom' | 'middle';
  color?: 'primary' | 'secondary' | 'tertiary' | 'success' | 'warning' | 'danger' | 'light' | 'medium' | 'dark';
  icon?: string;
  cssClass?: string | string[];
  buttons?: ToastOptions['buttons'];
  translucent?: boolean;
}
@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private readonly toastController = inject(ToastController);

  /**
   * Configuración por defecto para todos los toasts
   */
  private readonly defaultConfig: Partial<ToastConfig> = {
    duration: 3000,
    position: 'top',
    translucent: true,
  };

  /**
   * Muestra un toast con la configuración especificada
   *
   * @param config - Configuración del toast
   * @returns Promise que se resuelve cuando el toast se presenta
   */
  async show(config: ToastConfig): Promise<void> {
    const toastConfig: ToastOptions = {
      ...this.defaultConfig,
      ...config,
    };

    const toast = await this.toastController.create(toastConfig);
    await toast.present();
  }

  /**
   * Muestra un toast de éxito (color verde)
   *
   * @param message - Mensaje a mostrar
   * @param duration - Duración en milisegundos (opcional)
   */
  async success(message: string, duration?: number): Promise<void> {
    await this.show({
      message,
      duration: duration ?? 3000,
      color: 'success',
      icon: 'checkmark-circle-outline',
    });
  }

  /**
   * Muestra un toast de error (color rojo)
   *
   * @param message - Mensaje a mostrar
   * @param duration - Duración en milisegundos (opcional)
   */
  async error(message: string, duration?: number): Promise<void> {
    await this.show({
      message,
      duration: duration ?? 5000,
      color: 'danger',
      icon: 'close-circle-outline',
    });
  }

  /**
   * Muestra un toast de advertencia (color amarillo)
   *
   * @param message - Mensaje a mostrar
   * @param duration - Duración en milisegundos (opcional)
   */
  async warning(message: string, duration?: number): Promise<void> {
    await this.show({
      message,
      duration: duration ?? 3000,
      color: 'warning',
      icon: 'warning-outline',
    });
  }

  /**
   * Muestra un toast de información (color azul)
   *
   * @param message - Mensaje a mostrar
   * @param duration - Duración en milisegundos (opcional)
   */
  async info(message: string, duration?: number): Promise<void> {
    await this.show({
      message,
      duration: duration ?? 3000,
      color: 'primary',
      icon: 'information-circle-outline',
    });
  }

  /**
   * Muestra un toast con acción
   *
   * @param message - Mensaje a mostrar
   * @param actionText - Texto del botón de acción
   * @param actionHandler - Función a ejecutar al presionar el botón
   * @param color - Color del toast
   */
  async showWithAction(
    message: string,
    actionText: string,
    actionHandler: () => void,
    color: ToastConfig['color'] = 'primary'
  ): Promise<void> {
    await this.show({
      message,
      color,
      duration: 5000,
      buttons: [
        {
          text: actionText,
          role: 'cancel',
          handler: actionHandler,
        },
      ],
    });
  }

  /**
   * Cierra todos los toasts activos
   */
  async dismissAll(): Promise<void> {
    const toast = await this.toastController.getTop();
    if (toast) {
      await this.toastController.dismiss();
    }
  }
}
