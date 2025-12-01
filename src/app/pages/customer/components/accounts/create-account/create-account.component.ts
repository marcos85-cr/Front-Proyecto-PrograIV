import { Component, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, AlertController } from '@ionic/angular';
import { ToastService } from '../../../../../services/toast.service';
import { CustomerAccountsService } from '../../../services/customer-accounts.service';
import { CrearCuentaRequest } from '../../../model/account.model';

@Component({
  selector: 'app-create-account',
  templateUrl: './create-account.component.html',
  styleUrls: ['./create-account.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class CreateAccountComponent {
  // Datos del formulario
  accountType = signal<'Ahorro' | 'Corriente'>('Ahorro');
  currency = signal<'CRC' | 'USD'>('CRC');
  initialDeposit = signal<number>(0);

  // Estado del formulario
  isSubmitting = signal(false);

  // Límites y validaciones
  readonly minDepositCRC = 5000;
  readonly minDepositUSD = 10;

  constructor(
    private alertController: AlertController,
    private router: Router,
    private location: Location,
    private toastService: ToastService,
    private accountsService: CustomerAccountsService
  ) {}

  get minDeposit(): number {
    return this.currency() === 'USD' ? this.minDepositUSD : this.minDepositCRC;
  }

  get currencySymbol(): string {
    return this.currency() === 'USD' ? '$' : '₡';
  }

  isFormValid(): boolean {
    return this.initialDeposit() >= this.minDeposit;
  }

  async confirmCreation(): Promise<void> {
    if (!this.isFormValid()) {
      this.toastService.warning(`El depósito inicial mínimo es ${this.currencySymbol}${this.minDeposit.toLocaleString('es-CR')}`);
      return;
    }

    const alert = await this.alertController.create({
      header: 'Confirmar Creación',
      message: `¿Desea crear una cuenta de ${this.accountType()} en ${this.currency()} con un depósito inicial de ${this.currencySymbol}${this.initialDeposit().toLocaleString('es-CR', { minimumFractionDigits: 2 })}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Crear',
          role: 'confirm',
          handler: () => this.createAccount()
        }
      ]
    });

    await alert.present();
  }

  private createAccount(): void {
    if (this.isSubmitting()) return;

    const request: CrearCuentaRequest = {
      tipo: this.accountType(),
      moneda: this.currency(),
      saldoInicial: this.initialDeposit()
    };

    this.isSubmitting.set(true);

    this.accountsService.createAccount(request).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success('Cuenta creada exitosamente');
          this.router.navigate(['/customer/cuentas', response.data?.id]);
        } else {
          this.toastService.error(response.message || 'Error al crear cuenta');
        }
        this.isSubmitting.set(false);
      },
      error: (error) => {
        console.error('Error al crear cuenta:', error);
        this.toastService.error('Error al crear cuenta');
        this.isSubmitting.set(false);
      }
    });
  }

  goBack(): void {
    this.location.back();
  }
}
