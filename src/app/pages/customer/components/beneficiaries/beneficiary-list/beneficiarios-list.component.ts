import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { IonicModule, AlertController } from '@ionic/angular';
import { ToastService } from '../../../../../services/toast.service';
import { BeneficiariosService } from '../../../services/beneficiarios.service';
import { BeneficiarioListaDto } from '../../../model/beneficiario.model';

@Component({
  selector: 'app-beneficiarios-list',
  templateUrl: './beneficiarios-list.component.html',
  styleUrls: ['./beneficiarios-list.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, RouterModule]
})
export class BeneficiariosListComponent implements OnInit {
  beneficiarios = signal<BeneficiarioListaDto[]>([]);
  filteredBeneficiarios = signal<BeneficiarioListaDto[]>([]);
  searchTerm = signal('');
  filterEstado = signal('todos');
  isLoading = signal(false);

  constructor(
    private alertController: AlertController,
    private router: Router,
    private location: Location,
    private toastService: ToastService,
    private beneficiariosService: BeneficiariosService
  ) {}

  ngOnInit() {
    this.loadBeneficiarios();
  }

  loadBeneficiarios(): void {
    this.isLoading.set(true);
    this.beneficiariosService.getMisBeneficiarios().subscribe({
      next: (response) => {
        if (response.success) {
          this.beneficiarios.set(response.data || []);
          this.filterBeneficiarios();
        } else {
          this.toastService.warning(response.message || 'Error al cargar beneficiarios');
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.error('Error al cargar beneficiarios');
        this.isLoading.set(false);
      }
    });
  }

  filterBeneficiarios(): void {
    const term = this.searchTerm().trim().toLowerCase();
    const estado = this.filterEstado();

    let filtered = this.beneficiarios();

    if (estado !== 'todos') {
      filtered = filtered.filter(b => b.estado === estado);
    }

    if (term) {
      filtered = filtered.filter(b =>
        b.alias.toLowerCase().includes(term) ||
        b.nombreDestinatario.toLowerCase().includes(term) ||
        b.numeroCuenta.toLowerCase().includes(term)
      );
    }

    this.filteredBeneficiarios.set(filtered);
  }

  goToCrear(): void {
    this.router.navigate(['/customer/transferencias/beneficiarios/crear']);
  }

  goToDetalle(id: number): void {
    this.router.navigate(['/customer/transferencias/beneficiarios', id]);
  }

  goToTransferir(beneficiario: BeneficiarioListaDto): void {
    if (beneficiario.estado !== 'Confirmado') {
      this.toastService.warning('El beneficiario debe estar confirmado para transferir');
      return;
    }
    this.router.navigate(['/customer/transferencias/nueva'], {
      queryParams: { beneficiarioId: beneficiario.id }
    });
  }

  async confirmarBeneficiario(beneficiario: BeneficiarioListaDto): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Confirmar Beneficiario',
      message: 'Ingrese el código de confirmación enviado por correo',
      inputs: [
        {
          name: 'codigo',
          type: 'text',
          placeholder: 'Código de confirmación'
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Confirmar',
          handler: (data) => {
            if (data.codigo) {
              this.executeConfirmar(beneficiario.id, data.codigo);
            } else {
              this.toastService.warning('Ingrese el código de confirmación');
              return false;
            }
            return true;
          }
        }
      ]
    });

    await alert.present();
  }

  private executeConfirmar(id: number, codigo: string): void {
    this.beneficiariosService.confirmar(id, codigo).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success('Beneficiario confirmado exitosamente');
          this.loadBeneficiarios();
        } else {
          this.toastService.error(response.message || 'Código inválido');
        }
      },
      error: () => this.toastService.error('Error al confirmar beneficiario')
    });
  }

  async eliminarBeneficiario(beneficiario: BeneficiarioListaDto): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Eliminar Beneficiario',
      message: `¿Está seguro que desea eliminar a "${beneficiario.alias}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => this.executeEliminar(beneficiario.id)
        }
      ]
    });

    await alert.present();
  }

  private executeEliminar(id: number): void {
    this.beneficiariosService.eliminar(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success('Beneficiario eliminado exitosamente');
          this.loadBeneficiarios();
        } else {
          this.toastService.error(response.message || 'Error al eliminar beneficiario');
        }
      },
      error: () => this.toastService.error('Error al eliminar beneficiario')
    });
  }

  handleRefresh(event: any): void {
    this.loadBeneficiarios();
    event.target.complete();
  }

  goBack(): void {
    this.location.back();
  }

  getEstadoColor(estado: string): string {
    switch (estado) {
      case 'Confirmado': return 'success';
      case 'Pendiente': return 'warning';
      default: return 'medium';
    }
  }

  getMaskedAccountNumber(numero: string): string {
    if (!numero || numero.length < 4) return numero;
    return `****${numero.slice(-4)}`;
  }
}
