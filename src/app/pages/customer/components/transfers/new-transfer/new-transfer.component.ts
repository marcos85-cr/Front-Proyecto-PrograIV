import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { IonicModule, AlertController } from '@ionic/angular';
import { ToastService } from '../../../../../services/toast.service';
import { CustomerTransfersService } from '../../../services/customer-transfers.service';
import { CustomerAccountsService } from '../../../services/customer-accounts.service';
import { CustomerBeneficiariesService } from '../../../services/customer-beneficiaries.service';
import { CuentaListaDto } from '../../../model/cuenta.model';
import { BeneficiarioListaDto } from '../../../model/beneficiario.model';
import { PreCheckTransferenciaRequest, EjecutarTransferenciaRequest, PreCheckTransferenciaResponse } from '../../../model/transfer.model';

@Component({
  selector: 'app-new-transfer',
  templateUrl: './new-transfer.component.html',
  styleUrls: ['./new-transfer.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class NewTransferComponent implements OnInit {
  // Estado del wizard
  currentStep = signal(1);

  // Datos del formulario
  sourceAccountId = signal<number | null>(null);
  searchType = signal<'cuenta' | 'beneficiario'>('cuenta');
  destinationAccountNumber = signal('');
  beneficiaryId = signal<number | null>(null);
  amount = signal<number>(0);
  currency = signal<'CRC' | 'USD'>('CRC');
  description = signal('');

  // Listas
  myAccounts = signal<CuentaListaDto[]>([]);
  myBeneficiaries = signal<BeneficiarioListaDto[]>([]);

  // Estado
  isLoading = signal(false);
  isPreChecking = signal(false);
  isSubmitting = signal(false);
  preCheckResult = signal<PreCheckTransferenciaResponse | null>(null);

  // Limits
  readonly dailyLimit = 5000000;
  readonly approvalThreshold = 1000000;
  readonly minimumAmount = 100;
  readonly thirdPartyFee = 500;

  // Signals computados
  sourceAccount = computed(() => {
    const id = this.sourceAccountId();
    return this.myAccounts().find(c => c.id === id) || null;
  });

  selectedBeneficiary = computed(() => {
    const id = this.beneficiaryId();
    return this.myBeneficiaries().find(b => b.id === id) || null;
  });

  constructor(
    private alertController: AlertController,
    private router: Router,
    private route: ActivatedRoute,
    private location: Location,
    private toastService: ToastService,
    private transfersService: CustomerTransfersService,
    private accountsService: CustomerAccountsService,
    private beneficiariesService: CustomerBeneficiariesService
  ) {}

  ngOnInit() {
    this.loadAccounts();
    this.loadBeneficiaries();

    // Verificar si viene con cuenta pre-seleccionada
    const sourceAccount = this.route.snapshot.queryParamMap.get('cuentaOrigen');
    if (sourceAccount) {
      this.sourceAccountId.set(+sourceAccount);
    }
  }

  loadAccounts(): void {
    this.accountsService.getMisCuentas().subscribe({
      next: (response) => {
        if (response.success) {
          // Solo cuentas activas
          const active = (response.data || []).filter((c: CuentaListaDto) => c.estado === 'Activa');
          this.myAccounts.set(active);

          // Si solo hay una cuenta, seleccionarla automáticamente
          if (active.length === 1 && !this.sourceAccountId()) {
            this.sourceAccountId.set(active[0].id);
          }
        }
      },
      error: () => this.toastService.error('Error al cargar cuentas')
    });
  }

  loadBeneficiaries(): void {
    this.beneficiariesService.getMyBeneficiaries().subscribe({
      next: (response: any) => {
        if (response.success) {
          console.log(response.data);
          // Solo beneficiarios confirmados
          const confirmed = (response.data || []).filter((b: BeneficiarioListaDto) => b.estado === 'Confirmado');
          this.myBeneficiaries.set(confirmed);
        }
      },
      error: () => this.toastService.error('Error al cargar beneficiarios')
    });
  }

  nextStep(): void {
    if (this.currentStep() === 1 && !this.sourceAccountId()) {
      this.toastService.warning('Seleccione una cuenta de origen');
      return;
    }

    if (this.currentStep() === 2) {
      if (this.searchType() === 'cuenta' && !this.destinationAccountNumber()) {
        this.toastService.warning('Ingrese el número de cuenta destino');
        return;
      }
      if (this.searchType() === 'beneficiario' && !this.beneficiaryId()) {
        this.toastService.warning('Seleccione un beneficiario');
        return;
      }
    }

    if (this.currentStep() === 3) {
      if (this.amount() < this.minimumAmount) {
        this.toastService.warning(`El monto mínimo es ₡${this.minimumAmount.toLocaleString('es-CR')}`);
        return;
      }
      this.performPreCheck();
      return;
    }

    this.currentStep.update(s => s + 1);
  }

  prevStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.update(s => s - 1);
      this.preCheckResult.set(null);
    }
  }

  performPreCheck(): void {
    const destinationAccount = this.searchType() === 'beneficiario'
      ? this.selectedBeneficiary()?.numeroCuenta || ''
      : this.destinationAccountNumber();

    const request: PreCheckTransferenciaRequest = {
      cuentaOrigenId: this.sourceAccountId()!,
      cuentaDestinoNumero: destinationAccount,
      monto: this.amount(),
      moneda: this.currency()
    };

    this.isPreChecking.set(true);

    this.transfersService.preCheck(request).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.preCheckResult.set(response.data);
          if (response.data) {
            this.currentStep.set(4);
          } else {
            this.toastService.error(response.data.mensaje || 'Transferencia no válida');
          }
        } else {
          this.toastService.error(response.message || 'Error en validación');
        }
        this.isPreChecking.set(false);
      },
      error: (error) => {
        this.toastService.error(error.message || 'Error en validación');
        this.isPreChecking.set(false);
      }
    });
  }

  async confirmTransfer(): Promise<void> {
    const preCheck = this.preCheckResult();
    if (!preCheck) return;

    const message = preCheck.requiereAprobacion
      ? `Esta transferencia requiere aprobación administrativa. ¿Desea continuar?`
      : `¿Confirma la transferencia de ${this.formatCurrency(this.amount())}?`;

    const alert = await this.alertController.create({
      header: 'Confirmar Transferencia',
      message: message,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Transferir',
          role: 'confirm',
          handler: () => this.executeTransfer()
        }
      ]
    });

    await alert.present();
  }

  private executeTransfer(): void {
    const destinationAccount = this.searchType() === 'beneficiario'
      ? this.selectedBeneficiary()?.numeroCuenta || ''
      : this.destinationAccountNumber();

    const request: EjecutarTransferenciaRequest = {
      cuentaOrigenId: this.sourceAccountId()!,
      cuentaDestinoNumero: destinationAccount,
      monto: this.amount(),
      moneda: this.currency(),
      descripcion: this.description() || 'Transferencia'
    };

    this.isSubmitting.set(true);

    this.transfersService.execute(request).subscribe({
      next: (response: any) => {
        if (response.success) {
          const message = response.data?.requiereAprobacion
            ? 'Transferencia enviada. Pendiente de aprobación.'
            : 'Transferencia realizada exitosamente';
          this.toastService.success(message);
          this.router.navigate(['/customer/transferencias']);
        } else {
          this.toastService.error(response.message || 'Error al realizar transferencia');
        }
        this.isSubmitting.set(false);
      },
      error: () => {
        this.toastService.error('Error al realizar transferencia');
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

  formatCurrency(amount: number): string {
    const symbol = this.currency() === 'USD' ? '$' : '₡';
    return `${symbol}${amount.toLocaleString('es-CR', { minimumFractionDigits: 2 })}`;
  }

  getMaskedAccountNumber(number: string): string {
    if (!number || number.length < 4) return number;
    return `****${number.slice(-4)}`;
  }
  goToBeneficiary(): void {
    this.router.navigate(['/customer/transferencias/beneficiarios/crear']);
  }
}
