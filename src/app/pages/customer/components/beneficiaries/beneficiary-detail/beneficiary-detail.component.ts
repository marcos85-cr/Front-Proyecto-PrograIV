import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule, AlertController } from '@ionic/angular';
import { catchError, finalize, tap, EMPTY } from 'rxjs';
import { ToastService } from '../../../../../services/toast.service';
import { BeneficiariosService } from '../../../services/beneficiarios.service';
import { BeneficiarioDetalleDto } from '../../../model/beneficiario.model';

@Component({
  selector: 'app-beneficiary-detail',
  templateUrl: './beneficiary-detail.component.html',
  styleUrls: ['./beneficiary-detail.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class BeneficiaryDetailComponent implements OnInit {
  beneficiario = signal<BeneficiarioDetalleDto | null>(null);
  isLoading = signal(false);
  beneficiarioId = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private alertController: AlertController,
    private toastService: ToastService,
    private beneficiariosService: BeneficiariosService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.beneficiarioId = parseInt(id, 10);
      this.loadBeneficiario();
    }
  }

  loadBeneficiario(): void {
    this.isLoading.set(true);

    this.beneficiariosService.getBeneficiarioById(this.beneficiarioId).pipe(
      tap((response) => {
        if (response.success && response.data) {
          this.beneficiario.set(response.data);
        } else {
          this.toastService.error('No se encontró el beneficiario');
          this.goBack();
        }
      }),
      catchError(() => {
        this.toastService.error('Error al cargar beneficiario');
        this.goBack();
        return EMPTY;
      }),
      finalize(() => this.isLoading.set(false))
    ).subscribe();
  }

  async editarAlias(): Promise<void> {
    const beneficiario = this.beneficiario();
    if (!beneficiario) return;

    if (beneficiario.tieneOperacionesPendientes) {
      this.toastService.warning('No se puede editar el beneficiario porque tiene operaciones pendientes');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Editar Alias',
      message: 'Ingrese el nuevo alias para este beneficiario',
      inputs: [
        {
          name: 'nuevoAlias',
          type: 'text',
          value: beneficiario.alias,
          placeholder: 'Nuevo alias'
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          handler: (data) => {
            if (!data.nuevoAlias || data.nuevoAlias.trim().length < 2) {
              this.toastService.warning('El alias debe tener al menos 2 caracteres');
              return false;
            }
            this.executeEditarAlias(data.nuevoAlias.trim());
            return true;
          }
        }
      ]
    });

    await alert.present();
  }

  private executeEditarAlias(nuevoAlias: string): void {
    this.beneficiariosService.actualizar(this.beneficiarioId, { nuevoAlias }).pipe(
      tap((response) => {
        if (response.success) {
          this.toastService.success('Alias actualizado exitosamente');
          this.loadBeneficiario();
        } else {
          this.toastService.error(response.message || 'Error al actualizar alias');
        }
      }),
      catchError(() => {
        this.toastService.error('Error al actualizar alias');
        return EMPTY;
      })
    ).subscribe();
  }

  async confirmarBeneficiario(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Confirmar Beneficiario',
      message: '¿Desea confirmar este beneficiario para poder usarlo en transferencias?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Confirmar',
          handler: () => this.executeConfirmar()
        }
      ]
    });

    await alert.present();
  }

  private executeConfirmar(): void {
    this.beneficiariosService.confirmar(this.beneficiarioId).pipe(
      tap((response) => {
        if (response.success) {
          this.toastService.success('Beneficiario confirmado exitosamente');
          this.loadBeneficiario();
        } else {
          this.toastService.error(response.message || 'Error al confirmar');
        }
      }),
      catchError(() => {
        this.toastService.error('Error al confirmar beneficiario');
        return EMPTY;
      })
    ).subscribe();
  }

  async eliminarBeneficiario(): Promise<void> {
    const beneficiario = this.beneficiario();
    if (!beneficiario) return;

    if (beneficiario.tieneOperacionesPendientes) {
      this.toastService.warning('No se puede eliminar el beneficiario porque tiene operaciones pendientes');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Eliminar Beneficiario',
      message: `¿Está seguro que desea eliminar a "${beneficiario.alias}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => this.executeEliminar()
        }
      ]
    });

    await alert.present();
  }

  private executeEliminar(): void {
    this.beneficiariosService.eliminar(this.beneficiarioId).pipe(
      tap((response) => {
        if (response.success) {
          this.toastService.success('Beneficiario eliminado exitosamente');
          this.router.navigate(['/customer/transferencias/beneficiarios']);
        } else {
          this.toastService.error(response.message || 'Error al eliminar');
        }
      }),
      catchError(() => {
        this.toastService.error('Error al eliminar beneficiario');
        return EMPTY;
      })
    ).subscribe();
  }

  goToTransferir(): void {
    const beneficiario = this.beneficiario();
    if (!beneficiario) return;

    if (beneficiario.estado !== 'Confirmado') {
      this.toastService.warning('El beneficiario debe estar confirmado para transferir');
      return;
    }

    this.router.navigate(['/customer/transferencias/nueva'], {
      queryParams: { beneficiarioId: beneficiario.id }
    });
  }

  formatDate(dateString: string | Date): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-CR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getEstadoColor(estado: string): string {
    switch (estado) {
      case 'Confirmado': return 'success';
      case 'Inactivo': return 'warning';
      default: return 'medium';
    }
  }

  getMaskedAccountNumber(numero: string): string {
    if (!numero || numero.length < 4) return numero;
    return `****${numero.slice(-4)}`;
  }

  goBack(): void {
    this.location.back();
  }
}
