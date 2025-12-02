import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { IonicModule, AlertController, ViewWillEnter, ViewWillLeave } from '@ionic/angular';
import { ToastService } from '../../../../../services/toast.service';
import { CustomerBeneficiariesService } from '../../../services/customer-beneficiaries.service';
import { BeneficiarioListaDto } from '../../../model/beneficiary.model';

@Component({
  selector: 'app-beneficiary-list',
  templateUrl: './beneficiary-list.component.html',
  styleUrls: ['./beneficiary-list.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, RouterModule]
})
export class BeneficiaryListComponent implements OnInit, OnDestroy, ViewWillEnter, ViewWillLeave {
  beneficiaries = signal<BeneficiarioListaDto[]>([]);
  filteredBeneficiaries = signal<BeneficiarioListaDto[]>([]);
  searchTerm = signal('');
  filterStatus = signal('todos');
  isLoading = signal(false);

  constructor(
    private alertController: AlertController,
    private router: Router,
    private location: Location,
    private toastService: ToastService,
    private customerBeneficiariesService: CustomerBeneficiariesService
  ) {}

  ngOnInit() {
    // Inicialización
  }

  ngOnDestroy(): void {
    this.resetData();
  }

  ionViewWillEnter(): void {
    this.loadBeneficiaries();
  }

  ionViewWillLeave(): void {
    this.resetData();
  }

  private resetData(): void {
    this.beneficiaries.set([]);
    this.filteredBeneficiaries.set([]);
    this.searchTerm.set('');
    this.filterStatus.set('todos');
    this.isLoading.set(false);
  }

  loadBeneficiaries(): void {
    this.isLoading.set(true);
    this.customerBeneficiariesService.getMyBeneficiaries().subscribe({
      next: (response: any) => {
        if (response.success) {
          this.beneficiaries.set(response.data || []);
          this.filterBeneficiaries();
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

  filterBeneficiaries(): void {
    const term = this.searchTerm().trim().toLowerCase();
    const status = this.filterStatus();

    let filtered = this.beneficiaries();

    if (status !== 'todos') {
      filtered = filtered.filter(b => b.estado === status);
    }

    if (term) {
      filtered = filtered.filter(b =>
        b.alias.toLowerCase().includes(term) ||
        b.nombreDestinatario.toLowerCase().includes(term) ||
        b.numeroCuenta.toLowerCase().includes(term)
      );
    }

    this.filteredBeneficiaries.set(filtered);
  }

  goToCreate(): void {
    this.router.navigate(['/customer/transferencias/beneficiarios/crear']);
  }

  goToDetail(id: number): void {
    this.router.navigate(['/customer/transferencias/beneficiarios', id]);
  }

  goToTransfer(beneficiary: BeneficiarioListaDto): void {
    if (beneficiary.estado !== 'Confirmado') {
      this.toastService.warning('El beneficiario debe estar confirmado para transferir');
      return;
    }
    this.router.navigate(['/customer/transferencias/nueva'], {
      queryParams: { beneficiarioId: beneficiary.id }
    });
  }

  async confirmBeneficiary(beneficiary: BeneficiarioListaDto): Promise<void> {
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
              this.executeConfirm(beneficiary.id, data.codigo);
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

  private executeConfirm(id: number, code: string): void {
    this.customerBeneficiariesService.confirm(id, code).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.toastService.success('Beneficiario confirmado exitosamente');
          this.loadBeneficiaries();
        } else {
          this.toastService.error(response.message || 'Código inválido');
        }
      },
      error: () => this.toastService.error('Error al confirmar beneficiario')
    });
  }

  async deleteBeneficiary(beneficiary: BeneficiarioListaDto): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Eliminar Beneficiario',
      message: `¿Está seguro que desea eliminar a "${beneficiary.alias}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => this.executeDelete(beneficiary.id)
        }
      ]
    });

    await alert.present();
  }

  private executeDelete(id: number): void {
    this.customerBeneficiariesService.delete(id).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.toastService.success('Beneficiario eliminado exitosamente');
          this.loadBeneficiaries();
        } else {
          this.toastService.error(response.message || 'Error al eliminar beneficiario');
        }
      },
      error: () => this.toastService.error('Error al eliminar beneficiario')
    });
  }

  handleRefresh(event: any): void {
    this.loadBeneficiaries();
    event.target.complete();
  }

  goBack(): void {
    this.location.back();
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'Confirmado': return 'success';
      case 'Inactivo': return 'warning';
      default: return 'medium';
    }
  }

  getMaskedAccountNumber(number: string): string {
    if (!number || number.length < 4) return number;
    return `****${number.slice(-4)}`;
  }
}
