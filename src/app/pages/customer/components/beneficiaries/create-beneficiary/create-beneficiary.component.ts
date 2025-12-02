import { Component, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, AlertController } from '@ionic/angular';
import { ToastService } from '../../../../../services/toast.service';
import { BeneficiariosService } from '../../../services/beneficiarios.service';
import { CrearBeneficiarioRequest } from '../../../model/beneficiario.model';

@Component({
  selector: 'app-create-beneficiary',
  templateUrl: './create-beneficiary.component.html',
  styleUrls: ['./create-beneficiary.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class CreateBeneficiaryComponent {
  alias = signal('');
  banco = signal('');
  moneda = signal<'CRC' | 'USD'>('CRC');
  numeroCuentaDestino = signal('');
  pais = signal('Costa Rica');

  isSubmitting = signal(false);

  bancos = [
    'BAC Credomatic',
    'Banco Nacional',
    'Banco de Costa Rica',
    'Scotiabank',
    'Davivienda',
    'Banco Popular',
    'Promerica',
    'Banco Improsa'
  ];

  paises = ['Costa Rica', 'Panamá', 'Nicaragua', 'Honduras', 'El Salvador', 'Guatemala'];

  constructor(
    private alertController: AlertController,
    private router: Router,
    private location: Location,
    private toastService: ToastService,
    private beneficiariosService: BeneficiariosService
  ) {}

  isFormValid(): boolean {
    return this.alias().trim().length >= 2 &&
           this.banco().trim().length > 0 &&
           this.numeroCuentaDestino().trim().length >= 10;
  }

  async confirmarCreacion(): Promise<void> {
    if (!this.isFormValid()) {
      this.toastService.warning('Complete todos los campos requeridos');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Agregar Beneficiario',
      message: `¿Confirma agregar a "${this.alias()}" como beneficiario? Deberá confirmarlo antes de poder usarlo.`,
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
      alias: this.alias().trim(),
      banco: this.banco().trim(),
      moneda: this.moneda(),
      numeroCuentaDestino: this.numeroCuentaDestino().trim()
    };

    if (this.pais().trim()) {
      request.pais = this.pais().trim();
    }

    this.isSubmitting.set(true);

    this.beneficiariosService.crear(request).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success('Beneficiario creado. Debe confirmarlo antes de poder usarlo.');
          this.router.navigate(['/customer/transferencias/beneficiarios']);
        } else {
          this.toastService.error(response.message || 'Error al crear beneficiario');
        }
        this.isSubmitting.set(false);
      },
      error: (error) => {
        this.toastService.error(error?.message || 'Error al crear beneficiario');
        this.isSubmitting.set(false);
      }
    });
  }

  goBack(): void {
    this.location.back();
  }
}
