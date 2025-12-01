import { Component, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, AlertController } from '@ionic/angular';
import { ToastService } from '../../../../../services/toast.service';
import { BeneficiariosService } from '../../../services/beneficiarios.service';
import { CrearBeneficiarioRequest } from '../../../model/beneficiario.model';

@Component({
  selector: 'app-crear-beneficiario',
  templateUrl: './crear-beneficiario.component.html',
  styleUrls: ['./crear-beneficiario.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class CrearBeneficiarioComponent {
  // Datos del formulario
  numeroCuenta = signal('');
  alias = signal('');
  email = signal('');
  limiteTransferencia = signal<number | null>(null);

  // Estado
  isSubmitting = signal(false);

  constructor(
    private alertController: AlertController,
    private router: Router,
    private location: Location,
    private toastService: ToastService,
    private beneficiariosService: BeneficiariosService
  ) {}

  isFormValid(): boolean {
    return this.numeroCuenta().trim().length >= 10 &&
           this.alias().trim().length >= 2;
  }

  async confirmarCreacion(): Promise<void> {
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
          handler: () => this.crearBeneficiario()
        }
      ]
    });

    await alert.present();
  }

  private crearBeneficiario(): void {
    if (this.isSubmitting()) return;

    const request: CrearBeneficiarioRequest = {
      numeroCuenta: this.numeroCuenta().trim(),
      alias: this.alias().trim()
    };

    if (this.email().trim()) {
      request.emailNotificacion = this.email().trim();
    }

    if (this.limiteTransferencia()) {
      request.limiteTransferencia = this.limiteTransferencia()!;
    }

    this.isSubmitting.set(true);

    this.beneficiariosService.crear(request).subscribe({
      next: (response) => {
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
