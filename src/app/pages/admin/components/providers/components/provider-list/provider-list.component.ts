import { Component, OnInit, OnDestroy } from '@angular/core';
import { ProviderService } from '../../../../../../services/provider.service';
import { ToastService } from '../../../../../../services/toast.service';
import { ErrorHandlerService } from '../../../../../../services/error-handler.service';
import { Provider } from '../../models/provider.model';
import { AlertController, IonicModule, ViewWillEnter, ViewWillLeave } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Location } from '@angular/common';

@Component({
  selector: 'app-provider-list',
  templateUrl: './provider-list.component.html',
  styleUrls: ['./provider-list.component.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    RouterModule,
  ],
})
export class ProviderListComponent implements OnInit, OnDestroy, ViewWillEnter, ViewWillLeave {
  providers: Provider[] = [];
  isLoading = false;
  searchTerm = '';

  constructor(
    private providerService: ProviderService,
    private toastService: ToastService,
    private errorHandler: ErrorHandlerService,
    private router: Router,
    private alertController: AlertController,
    private location: Location,
  ) {}

  ngOnInit(): void {
    // Inicialización
  }

  ngOnDestroy(): void {
    this.resetData();
  }

  /**
   * Se ejecuta cada vez que la vista está a punto de entrar
   * Útil para refrescar datos cuando se vuelve de otra página
   */
  ionViewWillEnter(): void {
    this.loadProviders();
  }

  ionViewWillLeave(): void {
    this.resetData();
  }

  private resetData(): void {
    this.providers = [];
    this.isLoading = false;
    this.searchTerm = '';
  }

  /**
   * Carga la lista de proveedores desde el servicio
   */
  loadProviders(): void {
    this.isLoading = true;

    this.providerService.getProviders().subscribe({
      next: (response: any) => {
        if (response.success) {
          this.providers = response.data;
        } else {
          this.toastService.warning(response.message || 'Error al cargar proveedores');
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        this.errorHandler.handleError(error, 'loadProviders').subscribe({
          error: (errorDetails: any) => {
            this.toastService.error(errorDetails.message);
            this.isLoading = false;
          }
        });
      }
    });
  }

  async deleteProvider(provider: Provider): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Eliminar Proveedor',
      message: `¿Está seguro que desea eliminar al proveedor ${provider.nombre}? Esta acción no se puede deshacer.`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.executeDeleteProvider(provider);
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Ejecuta la eliminación del proveedor después de la confirmación
   */
  private executeDeleteProvider(provider: Provider): void {
    this.providerService.deleteProvider(provider.id).subscribe({
      next: () => {
        this.providers = this.providers.filter(p => p.id !== provider.id);
        this.toastService.success('Proveedor eliminado exitosamente');
        this.refreshProviders();
      },
      error: (error) => {
        const message = error?.message || 'Error al eliminar proveedor';
        this.toastService.error(message);
      }
    });
  }

  /**
   * Obtiene los proveedores filtrados según los criterios de búsqueda
   *
   * @returns Lista de proveedores filtrados
   */
  get filteredProviders(): Provider[] {
    return this.providers.filter(provider => {
      // Filtrar por término de búsqueda
      const matchesSearch = !this.searchTerm ||
        provider.nombre.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        provider.reglaValidacionContrato.toLowerCase().includes(this.searchTerm.toLowerCase());

      return matchesSearch;
    });
  }

  /**
   * Recarga la lista de proveedores
   */
  refreshProviders(): void {
    this.loadProviders();
  }

  goToCreateProvider(): void {
    this.router.navigate(['/admin/providers/create']);
  }

  goToEditProvider(providerId: number): void {
    this.router.navigate([`/admin/providers/edit/${providerId}`]);
  }

  goBack(): void {
    this.location.back();
  }

}
