import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { catchError, finalize, tap } from 'rxjs/operators';
import { EMPTY } from 'rxjs';

import { GestorService } from '../../../../services/gestor.service';
import { ToastService } from '../../../../services/toast.service';
import { AlertController, LoadingController } from '@ionic/angular';

import {
  CrearCuentaRequest,
  CuentaCreadaGestor,
  ClienteDetalleGestor,
  Result
} from '../../../../shared/models/gestor.model';

// Account types and currencies constants
export const ACCOUNT_TYPES = [
  { value: 'Ahorro', label: 'Cuenta de Ahorro' },
  { value: 'Corriente', label: 'Cuenta Corriente' }
] as const;

export const CURRENCIES = [
  { value: 'CRC', label: 'Colones Costarricenses (CRC)' },
  { value: 'USD', label: 'Dólares Estadounidenses (USD)' }
] as const;

@Component({
  selector: 'app-crear-cuenta-form',
  templateUrl: './crear-cuenta-form.component.html',
  styleUrls: ['./crear-cuenta-form.component.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
  ],
})
export class CrearCuentaFormComponent implements OnInit {
  // Form
  cuentaForm: FormGroup;

  // Signals
  isLoading = signal(false);
  cliente = signal<ClienteDetalleGestor | null>(null);
  cuentasExistentes = signal<CuentaCreadaGestor[]>([]);

  // Options
  accountTypes = ACCOUNT_TYPES;
  currencies = CURRENCIES;

  // Computed properties
  hasCliente = computed(() => this.cliente() !== null);
  clienteId = computed(() => this.cliente()?.id || 0);

  constructor(
    private gestorService: GestorService,
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private toastService: ToastService,
    private alertController: AlertController,
    private loadingController: LoadingController
  ) {
    this.cuentaForm = this.fb.group({
      tipo: ['Ahorro', Validators.required],
      moneda: ['CRC', Validators.required],
      saldoInicial: [0, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit() {
    const clienteId = this.route.snapshot.paramMap.get('clienteId');
    if (clienteId) {
      this.loadCliente(parseInt(clienteId));
    } else {
      this.toastService.error('ID de cliente no proporcionado');
      this.goBack();
    }
  }

  loadCliente(clienteId: number) {
    this.isLoading.set(true);

    this.gestorService.getClienteDetalle(clienteId).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.cliente.set(response.data);
          this.loadCuentasExistentes(clienteId);
        }
      }),
      catchError(error => {
        console.error('Error loading cliente:', error);
        this.toastService.error('Error al cargar información del cliente');
        this.goBack();
        return EMPTY;
      }),
      finalize(() => this.isLoading.set(false))
    ).subscribe();
  }

  loadCuentasExistentes(clienteId: number) {
    this.gestorService.getCuentasCliente(clienteId).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.cuentasExistentes.set(response.data);
        }
      }),
      catchError(error => {
        console.error('Error loading cuentas existentes:', error);
        // No mostramos error aquí porque no es crítico para la creación
        return EMPTY;
      })
    ).subscribe();
  }

  // Get count of existing accounts with same type and currency
  getCuentasMismoTipo(tipo: string, moneda: string): number {
    return this.cuentasExistentes().filter(
      cuenta => cuenta.tipo === tipo && cuenta.moneda === moneda
    ).length;
  }

  // Check if can create more accounts of this type and currency
  puedeCrearMasCuentas(tipo: string, moneda: string): boolean {
    return this.getCuentasMismoTipo(tipo, moneda) < 3;
  }

  // Get warning message for account limit
  getMensajeLimite(tipo: string, moneda: string): string {
    const count = this.getCuentasMismoTipo(tipo, moneda);
    return `El cliente ya tiene ${count}/3 cuentas de tipo ${tipo} en ${moneda}`;
  }

  // Validate form and show warnings
  validateAndSubmit() {
    if (this.cuentaForm.invalid) {
      this.markFormGroupTouched(this.cuentaForm);
      this.toastService.warning('Por favor complete todos los campos requeridos');
      return;
    }

    const formData = this.cuentaForm.value;

    if (!this.puedeCrearMasCuentas(formData.tipo, formData.moneda)) {
      this.toastService.error(this.getMensajeLimite(formData.tipo, formData.moneda));
      return;
    }

    this.showConfirmationDialog(formData);
  }

  private async showConfirmationDialog(formData: CrearCuentaRequest) {
    const cliente = this.cliente();
    if (!cliente) return;

    const alert = await this.alertController.create({
      header: 'Confirmar Creación de Cuenta',
      message: `
        <div style="text-align: left;">
          <p><strong>Cliente:</strong> ${cliente.nombre}</p>
          <p><strong>Tipo de cuenta:</strong> ${formData.tipo}</p>
          <p><strong>Moneda:</strong> ${formData.moneda}</p>
          <p><strong>Saldo inicial:</strong> ${this.formatCurrency(formData.saldoInicial || 0, formData.moneda)}</p>
          <br>
          <p>¿Desea continuar con la creación de esta cuenta?</p>
        </div>
      `,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Crear Cuenta',
          handler: () => {
            this.submitForm(formData);
          }
        }
      ]
    });
    await alert.present();
  }

  submitForm(formData: CrearCuentaRequest) {
    const cliente = this.cliente();
    if (!cliente) return;

    this.isLoading.set(true);

    this.gestorService.crearCuenta(cliente.id, formData).pipe(
      tap(response => {
        if (response.success) {
          this.toastService.success('Cuenta creada exitosamente');
          this.showAccountDetails(response.data!);
        } else {
          this.toastService.error(response.message || 'Error al crear la cuenta');
        }
      }),
      catchError(error => {
        console.error('Error creating account:', error);
        this.toastService.error('Error al crear la cuenta');
        return EMPTY;
      }),
      finalize(() => this.isLoading.set(false))
    ).subscribe();
  }

  private async showAccountDetails(cuenta: CuentaCreadaGestor) {
    const alert = await this.alertController.create({
      header: 'Cuenta Creada Exitosamente',
      message: `
        <div style="text-align: center;">
          <ion-icon name="checkmark-circle-outline" color="success" style="font-size: 3rem;"></ion-icon>
          <h3 style="color: #059669; margin: 1rem 0;">¡Cuenta Creada!</h3>
          <div style="text-align: left;">
            <p><strong>Número de cuenta:</strong> ${cuenta.numero}</p>
            <p><strong>Tipo:</strong> ${cuenta.tipo}</p>
            <p><strong>Moneda:</strong> ${cuenta.moneda}</p>
            <p><strong>Saldo inicial:</strong> ${this.formatCurrency(cuenta.saldo, cuenta.moneda)}</p>
            <p><strong>Estado:</strong> ${cuenta.estado}</p>
          </div>
        </div>
      `,
      buttons: [
        {
          text: 'Ver Detalle del Cliente',
          handler: () => {
            this.goToClienteDetail();
          }
        },
        {
          text: 'Crear Otra Cuenta',
          handler: () => {
            this.resetForm();
          }
        },
        {
          text: 'Cerrar',
          role: 'cancel',
          handler: () => {
            this.goToClienteDetail();
          }
        }
      ]
    });
    await alert.present();
  }

  resetForm() {
    this.cuentaForm.reset({
      tipo: 'Ahorro',
      moneda: 'CRC',
      saldoInicial: 0
    });
  }

  markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
    });
  }

  hasError(controlName: string, errorType: string): boolean {
    const control = this.cuentaForm.get(controlName);
    return control ? control.hasError(errorType) && control.touched : false;
  }

  getErrorMessage(controlName: string): string {
    const control = this.cuentaForm.get(controlName);
    if (!control) return '';

    if (control.hasError('required')) {
      return 'Este campo es obligatorio';
    }
    if (control.hasError('min')) {
      return 'El saldo inicial debe ser mayor o igual a 0';
    }
    return '';
  }

  formatCurrency(amount: number, currency: string): string {
    const symbol = currency === 'CRC' ? '₡' : '$';
    return `${symbol}${amount.toLocaleString('es-CR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }

  getAccountTypeLabel(value: string): string {
    const type = this.accountTypes.find(t => t.value === value);
    return type ? type.label : value;
  }

  getCurrencyLabel(value: string): string {
    const currency = this.currencies.find(c => c.value === value);
    return currency ? currency.label : value;
  }

  goBack() {
    this.router.navigate(['/gestor/clientes']);
  }

  goToClienteDetail() {
    const cliente = this.cliente();
    if (cliente) {
      this.router.navigate([`/gestor/clientes/${cliente.id}`]);
    } else {
      this.router.navigate(['/gestor/clientes']);
    }
  }

  // Helper method for account state color
  getEstadoColor(estado: string): string {
    switch (estado?.toLowerCase()) {
      case 'activo':
      case 'activa':
        return 'success';
      case 'inactivo':
      case 'inactiva':
        return 'danger';
      case 'suspendido':
        return 'warning';
      case 'bloqueada':
        return 'medium';
      default:
        return 'primary';
    }
  }
}