import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { IonicModule, AlertController } from '@ionic/angular';
import { ToastService } from '../../../../../services/toast.service';
import { CustomerPaymentsService } from '../../../services/customer-payments.service';
import { CustomerAccountsService } from '../../../services/customer-accounts.service';
import { ProveedorServicioDto, ValidarContratoRequest, RealizarPagoRequest, ContratoValidadoDto } from '../../../model/payment.model';
import { CuentaListaDto } from '../../../model/account.model';

@Component({
  selector: 'app-make-payment',
  templateUrl: './make-payment.component.html',
  styleUrls: ['./make-payment.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class MakePaymentComponent implements OnInit {
  // Estado del wizard
  currentStep = signal(1);

  // Datos
  providers = signal<ProveedorServicioDto[]>([]);
  myAccounts = signal<CuentaListaDto[]>([]);
  validatedContract = signal<ContratoValidadoDto | null>(null);

  // Formulario
  providerId = signal<number | null>(null);
  contractNumber = signal('');
  sourceAccountId = signal<number | null>(null);
  amount = signal<number>(0);
  description = signal('');

  // Estado
  isLoading = signal(false);
  isValidating = signal(false);
  isSubmitting = signal(false);

  // Computed
  selectedProvider = computed(() => {
    const id = this.providerId();
    return this.providers().find(p => p.id === id) || null;
  });

  sourceAccount = computed(() => {
    const id = this.sourceAccountId();
    return this.myAccounts().find(c => c.id === id) || null;
  });

  constructor(
    private alertController: AlertController,
    private router: Router,
    private route: ActivatedRoute,
    private location: Location,
    private toastService: ToastService,
    private paymentsService: CustomerPaymentsService,
    private accountsService: CustomerAccountsService
  ) {}

  ngOnInit() {
    this.loadProviders();
    this.loadAccounts();
  }

  loadProviders(): void {
    this.isLoading.set(true);
    this.paymentsService.getProviders().subscribe({
      next: (response) => {
        if (response.success) {
          this.providers.set(response.data || []);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.error('Error al cargar proveedores');
        this.isLoading.set(false);
      }
    });
  }

  loadAccounts(): void {
    this.accountsService.getMisCuentas().subscribe({
      next: (response) => {
        if (response.success) {
          const active = (response.data || []).filter((c: CuentaListaDto) => c.estado === 'Activa');
          this.myAccounts.set(active);
          if (active.length === 1) {
            this.sourceAccountId.set(active[0].id);
          }
        }
      },
      error: () => this.toastService.error('Error al cargar cuentas')
    });
  }

  nextStep(): void {
    if (this.currentStep() === 1 && !this.providerId()) {
      this.toastService.warning('Seleccione un proveedor de servicio');
      return;
    }

    if (this.currentStep() === 2) {
      if (!this.contractNumber().trim()) {
        this.toastService.warning('Ingrese el número de contrato');
        return;
      }
      this.validateContract();
      return;
    }

    if (this.currentStep() === 3) {
      if (!this.sourceAccountId()) {
        this.toastService.warning('Seleccione una cuenta para pagar');
        return;
      }
      if (this.amount() <= 0) {
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
        this.validatedContract.set(null);
      }
    }
  }

  validateContract(): void {
    const provider = this.selectedProvider();
    if (!provider) return;

    const request: ValidarContratoRequest = {
      proveedorId: provider.id,
      numeroContrato: this.contractNumber().trim()
    };

    this.isValidating.set(true);

    this.paymentsService.validateContract(request).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.validatedContract.set(response.data);
          if (response.data.esValido) {
            this.amount.set(response.data.montoSugerido || 0);
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

  async confirmPayment(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Confirmar Pago',
      message: `¿Confirma el pago de ${this.formatCurrency(this.amount())} a ${this.selectedProvider()?.nombre}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Pagar',
          role: 'confirm',
          handler: () => this.executePayment()
        }
      ]
    });

    await alert.present();
  }

  private executePayment(): void {
    const request: RealizarPagoRequest = {
      proveedorId: this.providerId()!,
      numeroContrato: this.contractNumber().trim(),
      cuentaOrigenId: this.sourceAccountId()!,
      monto: this.amount(),
      descripcion: this.description() || `Pago ${this.selectedProvider()?.nombre}`
    };

    this.isSubmitting.set(true);

    this.paymentsService.makePayment(request).subscribe({
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

  formatCurrency(amount: number, currency: string = 'CRC'): string {
    const symbol = currency === 'USD' ? '$' : '₡';
    return `${symbol}${amount.toLocaleString('es-CR', { minimumFractionDigits: 2 })}`;
  }

  getProviderIcon(category: string | undefined): string {
    switch (category?.toLowerCase()) {
      case 'electricidad': return 'flash-outline';
      case 'agua': return 'water-outline';
      case 'telefono': case 'internet': return 'wifi-outline';
      case 'tv': case 'cable': return 'tv-outline';
      default: return 'business-outline';
    }
  }
}
