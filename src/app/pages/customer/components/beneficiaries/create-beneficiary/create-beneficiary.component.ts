import { Component, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, AlertController } from '@ionic/angular';
import { ToastService } from '../../../../../services/toast.service';
import { CustomerBeneficiariesService } from '../../../services/customer-beneficiaries.service';
import { CrearBeneficiarioRequest } from '../../../model/beneficiary.model';

@Component({
  selector: 'app-create-beneficiary',
  templateUrl: './create-beneficiary.component.html',
  styleUrls: ['./create-beneficiary.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class CreateBeneficiaryComponent {
  // Datos del formulario
  accountNumber = signal('');
  alias = signal('');
  email = signal('');
  transferLimit = signal<number | null>(null);

  // Estado
  isSubmitting = signal(false);

  constructor(
    private alertController: AlertController,
    private router: Router,
    private location: Location,
    private toastService: ToastService,
    private customerBeneficiariesService: CustomerBeneficiariesService
  ) {}

  isFormValid(): boolean {
    return this.accountNumber().trim().length >= 10 &&
           this.alias().trim().length >= 2;
  }

  async confirmCreation(): Promise<void> {
    if (!this.isFormValid()) {
      this.toastService.warning('Complete todos los campos requeridos');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Agregar Beneficiario',
      message: `¿Confirma agregar a "${this.alias()}" como beneficiario? Se enviará un código de confirmación a su correo.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Agregar',
          role: 'confirm',
          handler: () => this.createBeneficiary()
        }
      ]
    });

    await alert.present();
  }

  private createBeneficiary(): void {
    if (this.isSubmitting()) return;

    const request: CrearBeneficiarioRequest = {
      numeroCuenta: this.accountNumber().trim(),
      alias: this.alias().trim()
    };

    if (this.email().trim()) {
      request.emailNotificacion = this.email().trim();
    }

    if (this.transferLimit()) {
      request.limiteTransferencia = this.transferLimit()!;
    }

    this.isSubmitting.set(true);

    this.customerBeneficiariesService.create(request).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.toastService.success('Beneficiario agregado. Revise su correo para confirmar.');
          this.router.navigate(['/customer/transferencias/beneficiarios']);
        } else {
          this.toastService.error(response.message || 'Error al agregar beneficiario');
        }
        this.isSubmitting.set(false);
      },
      error: () => {
        this.toastService.error('Error al agregar beneficiario');
        this.isSubmitting.set(false);
      }
    });
  }

  goBack(): void {
    this.location.back();
  }
}
