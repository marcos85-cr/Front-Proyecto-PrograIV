import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { IonicModule, AlertController } from '@ionic/angular';
import { ToastService } from '../../../../../services/toast.service';
import { PagosServiciosService } from '../../../services/pagos-servicios.service';
import { CuentasClienteService } from '../../../services/cuentas-cliente.service';
import { ProveedorServicioDto, ValidarContratoRequest, RealizarPagoRequest, ContratoValidadoDto } from '../../../model/pago.model';
import { CuentaListaDto } from '../../../model/cuenta.model';

@Component({
  selector: 'app-realizar-pago',
  templateUrl: './realizar-pago.component.html',
  styleUrls: ['./realizar-pago.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class RealizarPagoComponent implements OnInit {
  // Estado del wizard
  currentStep = signal(1);

  // Datos
  proveedores = signal<ProveedorServicioDto[]>([]);
  misCuentas = signal<CuentaListaDto[]>([]);
  contratoValidado = signal<ContratoValidadoDto | null>(null);

  // Formulario
  proveedorId = signal<number | null>(null);
  numeroContrato = signal('');
  cuentaOrigenId = signal<number | null>(null);
  monto = signal<number>(0);
  descripcion = signal('');

  // Estado
  isLoading = signal(false);
  isValidating = signal(false);
  isSubmitting = signal(false);

  // Computed
  proveedorSeleccionado = computed(() => {
    const id = this.proveedorId();
    return this.proveedores().find(p => p.id === id) || null;
  });

  cuentaOrigen = computed(() => {
    const id = this.cuentaOrigenId();
    return this.misCuentas().find(c => c.id === id) || null;
  });

  constructor(
    private alertController: AlertController,
    private router: Router,
    private route: ActivatedRoute,
    private location: Location,
    private toastService: ToastService,
    private pagosService: PagosServiciosService,
    private cuentasService: CuentasClienteService
  ) {}

  ngOnInit() {
    this.loadProveedores();
    this.loadCuentas();
  }

  loadProveedores(): void {
    this.isLoading.set(true);
    this.pagosService.getProveedores().subscribe({
      next: (response) => {
        if (response.success) {
          this.proveedores.set(response.data || []);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.error('Error al cargar proveedores');
        this.isLoading.set(false);
      }
    });
  }

  loadCuentas(): void {
    this.cuentasService.getMisCuentas().subscribe({
      next: (response) => {
        if (response.success) {
          const activas = (response.data || []).filter((c: CuentaListaDto) => c.estado === 'Activa');
          this.misCuentas.set(activas);
          if (activas.length === 1) {
            this.cuentaOrigenId.set(activas[0].id);
          }
        }
      },
      error: () => this.toastService.error('Error al cargar cuentas')
    });
  }

  nextStep(): void {
    if (this.currentStep() === 1 && !this.proveedorId()) {
      this.toastService.warning('Seleccione un proveedor de servicio');
      return;
    }

    if (this.currentStep() === 2) {
      if (!this.numeroContrato().trim()) {
        this.toastService.warning('Ingrese el número de contrato');
        return;
      }
      this.validarContrato();
      return;
    }

    if (this.currentStep() === 3) {
      if (!this.cuentaOrigenId()) {
        this.toastService.warning('Seleccione una cuenta para pagar');
        return;
      }
      if (this.monto() <= 0) {
        this.toastService.warning('Ingrese un monto válido');
        return;
      }
      this.currentStep.set(4);
      return;
    }

    this.currentStep.update(s => s + 1);
  }

  prevStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.update(s => s - 1);
      if (this.currentStep() <= 2) {
        this.contratoValidado.set(null);
      }
    }
  }

  validarContrato(): void {
    const proveedor = this.proveedorSeleccionado();
    if (!proveedor) return;

    const request: ValidarContratoRequest = {
      proveedorId: proveedor.id,
      numeroContrato: this.numeroContrato().trim()
    };

    this.isValidating.set(true);

    this.pagosService.validarContrato(request).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.contratoValidado.set(response.data);
          if (response.data.esValido) {
            this.monto.set(response.data.montoSugerido || 0);
            this.currentStep.set(3);
          } else {
            this.toastService.error(response.data.mensaje || 'Contrato no válido');
          }
        } else {
          this.toastService.error(response.message || 'Error al validar contrato');
        }
        this.isValidating.set(false);
      },
      error: () => {
        this.toastService.error('Error al validar contrato');
        this.isValidating.set(false);
      }
    });
  }

  async confirmarPago(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Confirmar Pago',
      message: `¿Confirma el pago de ${this.formatCurrency(this.monto())} a ${this.proveedorSeleccionado()?.nombre}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Pagar',
          role: 'confirm',
          handler: () => this.ejecutarPago()
        }
      ]
    });

    await alert.present();
  }

  private ejecutarPago(): void {
    const request: RealizarPagoRequest = {
      proveedorId: this.proveedorId()!,
      numeroContrato: this.numeroContrato().trim(),
      cuentaOrigenId: this.cuentaOrigenId()!,
      monto: this.monto(),
      descripcion: this.descripcion() || `Pago ${this.proveedorSeleccionado()?.nombre}`
    };

    this.isSubmitting.set(true);

    this.pagosService.realizarPago(request).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success('Pago realizado exitosamente');
          this.router.navigate(['/customer/pagos']);
        } else {
          this.toastService.error(response.message || 'Error al realizar pago');
        }
        this.isSubmitting.set(false);
      },
      error: () => {
        this.toastService.error('Error al realizar pago');
        this.isSubmitting.set(false);
      }
    });
  }

  goBack(): void {
    if (this.currentStep() > 1) {
      this.prevStep();
    } else {
      this.location.back();
    }
  }

  formatCurrency(amount: number, moneda: string = 'CRC'): string {
    const symbol = moneda === 'USD' ? '$' : '₡';
    return `${symbol}${amount.toLocaleString('es-CR', { minimumFractionDigits: 2 })}`;
  }

  getProveedorIcon(categoria: string | undefined): string {
    switch (categoria?.toLowerCase()) {
      case 'electricidad': return 'flash-outline';
      case 'agua': return 'water-outline';
      case 'telefono': case 'internet': return 'wifi-outline';
      case 'tv': case 'cable': return 'tv-outline';
      default: return 'business-outline';
    }
  }
}
