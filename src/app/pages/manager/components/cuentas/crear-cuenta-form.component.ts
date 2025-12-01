import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { IonicModule, AlertController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { catchError, finalize, tap } from 'rxjs/operators';
import { EMPTY } from 'rxjs';

import { GestorService } from '../../../../services/gestor.service';
import { ToastService } from '../../../../services/toast.service';
import {
  CrearCuentaRequest,
  CuentaCreadaGestor,
  ClienteDetalleGestor,
} from '../../../../shared/models/gestor.model';
import { ACCOUNT_TYPES, CURRENCIES } from '../../../../shared/constants/account.constants';

@Component({
  selector: 'app-crear-cuenta-form',
  templateUrl: './crear-cuenta-form.component.html',
  styleUrls: ['./crear-cuenta-form.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule],
})
export class CrearCuentaFormComponent implements OnInit {
  cuentaForm: FormGroup;
  isLoading = signal(false);
  cliente = signal<ClienteDetalleGestor | null>(null);
  cuentasExistentes = signal<CuentaCreadaGestor[]>([]);

  accountTypes = ACCOUNT_TYPES;
  currencies = CURRENCIES;

  hasCliente = computed(() => this.cliente() !== null);

  constructor(
    private gestorService: GestorService,
    private route: ActivatedRoute,
    private location: Location,
    private fb: FormBuilder,
    private toastService: ToastService,
    private alertController: AlertController
  ) {
    this.cuentaForm = this.fb.group({
      tipo: ['Ahorro', Validators.required],
      moneda: ['CRC', Validators.required],
      saldoInicial: [0, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit() {
    const clienteId = this.route.snapshot.paramMap.get('id');
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
      catchError(() => EMPTY)
    ).subscribe();
  }

  getCuentasMismoTipo(tipo: string, moneda: string): number {
    return this.cuentasExistentes().filter(
      cuenta => cuenta.tipo === tipo && cuenta.moneda === moneda
    ).length;
  }

  puedeCrearMasCuentas(tipo: string, moneda: string): boolean {
    return this.getCuentasMismoTipo(tipo, moneda) < 3;
  }

  validateAndSubmit() {
    if (this.cuentaForm.invalid) {
      Object.values(this.cuentaForm.controls).forEach(c => c.markAsTouched());
      this.toastService.warning('Complete todos los campos requeridos');
      return;
    }

    const formData = this.cuentaForm.value;
    if (!this.puedeCrearMasCuentas(formData.tipo, formData.moneda)) {
      this.toastService.error(`Límite de cuentas ${formData.tipo} en ${formData.moneda} alcanzado`);
      return;
    }

    this.showConfirmationDialog(formData);
  }

  private async showConfirmationDialog(formData: CrearCuentaRequest) {
    const cliente = this.cliente();
    if (!cliente) return;

    const alert = await this.alertController.create({
      header: 'Confirmar Creación',
      subHeader: `Cliente: ${cliente.nombre}`,
      message: `Tipo: ${formData.tipo} | Moneda: ${formData.moneda} | Saldo inicial: ${this.formatCurrency(formData.saldoInicial || 0, formData.moneda)}`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Crear', handler: () => this.submitForm(formData) }
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
          this.showSuccessDialog(response.data!);
        } else {
          this.toastService.error(response.message || 'Error al crear la cuenta');
        }
      }),
      catchError(error => {
        this.toastService.error(error?.message || 'Error al crear la cuenta');
        return EMPTY;
      }),
      finalize(() => this.isLoading.set(false))
    ).subscribe();
  }

  private async showSuccessDialog(cuenta: CuentaCreadaGestor) {
    const alert = await this.alertController.create({
      header: '¡Cuenta Creada!',
      subHeader: `Número: ${cuenta.numero}`,
      message: `Tipo: ${cuenta.tipo} | Saldo: ${this.formatCurrency(cuenta.saldo, cuenta.moneda)}`,
      buttons: [
        {
          text: 'Crear Otra',
          handler: () => {
            this.cuentaForm.reset({ tipo: 'Ahorro', moneda: 'CRC', saldoInicial: 0 });
            this.loadCuentasExistentes(this.cliente()!.id);
          }
        },
        { text: 'Volver', handler: () => this.goBack() }
      ]
    });
    await alert.present();
  }

  hasError(controlName: string, errorType: string): boolean {
    const control = this.cuentaForm.get(controlName);
    return control ? control.hasError(errorType) && control.touched : false;
  }

  getErrorMessage(controlName: string): string {
    const control = this.cuentaForm.get(controlName);
    if (!control) return '';
    if (control.hasError('required')) return 'Campo obligatorio';
    if (control.hasError('min')) return 'El valor debe ser mayor o igual a 0';
    return '';
  }

  formatCurrency(amount: number, currency: string): string {
    const symbol = currency === 'CRC' ? '₡' : '$';
    return `${symbol}${amount.toLocaleString('es-CR', { minimumFractionDigits: 0 })}`;
  }

  getEstadoColor(estado: string): string {
    const colors: Record<string, string> = {
      'activo': 'success', 'activa': 'success',
      'inactivo': 'danger', 'inactiva': 'danger',
      'suspendido': 'warning', 'bloqueada': 'medium'
    };
    return colors[estado?.toLowerCase()] || 'primary';
  }

  goBack() {
    this.location.back();
  }
}
