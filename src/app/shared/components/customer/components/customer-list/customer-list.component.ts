import { CommonModule, Location } from '@angular/common';
import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Customer } from '../../models/customer.dto';
import { IonicModule, AlertController, ViewWillEnter, ViewWillLeave } from '@ionic/angular';
import { ToastService } from '../../../../../services/toast.service';
import { CustomerService } from '../../services/customer.service';

@Component({
  selector: 'app-customer-list',
  templateUrl: './customer-list.component.html',
  styleUrls: ['./customer-list.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, RouterModule]
})
export class CustomerListComponent implements OnInit, OnDestroy, ViewWillEnter, ViewWillLeave {
  // Signals para estado reactivo
  customers = signal<any[]>([]);
  filteredCustomers = signal<any[]>([]);
  searchTerm = signal('');
  isLoading = signal(false);

  // Signal computado para estadísticas
  stats = computed(() => {
    const customers = this.customers();
    return {
      totalCustomers: customers.length,
      totalAccounts: customers.reduce((sum, customer) => sum + (customer.cuentasActivas || 0), 0),
      activeCustomers: customers.filter(c => c.estado === 'Activo').length
    };
  });

  constructor(
    private alertController: AlertController,
    private router: Router,
    private location: Location,
    private toastService: ToastService,
    private customerService: CustomerService
  ) {}

  ngOnInit() {
    // Inicialización
  }

  ngOnDestroy(): void {
    this.resetData();
  }

  ionViewWillEnter(): void {
    this.loadCustomers();
  }

  ionViewWillLeave(): void {
    this.resetData();
  }

  private resetData(): void {
    this.customers.set([]);
    this.filteredCustomers.set([]);
    this.searchTerm.set('');
    this.isLoading.set(false);
  }

  loadCustomers(): void {
    this.isLoading.set(true);
    this.customerService.getCustomers().subscribe({
      next: (response) => {
        if (response.success) {
          this.customers.set(response.data || []);
          this.filteredCustomers.set(response.data || []);
        } else {
          this.toastService.warning(response.message || 'Error al cargar clientes');
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar clientes:', error);
        this.toastService.error('Error al cargar clientes');
        this.isLoading.set(false);
      }
    });
  }

  filterCustomers() {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) {
      this.filteredCustomers.set(this.customers());
      return;
    }

    const filtered = this.customers().filter(customer =>
      (customer.nombreCompleto?.toLowerCase() || '').includes(term) ||
      (customer.email?.toLowerCase() || '').includes(term) ||
      (customer.identificacion || '').includes(term) ||
      (customer.gestorNombre?.toLowerCase() || '').includes(term)
    );

    this.filteredCustomers.set(filtered);
  }

  goToCustomerDetail(customerId: number): void {
    this.router.navigate([`/admin/customers/detail/${customerId}`]);
  }

  goToCreateCustomer(): void {
    this.router.navigate(['/admin/customers/create']);
  }

  goToEditCustomer(customerId: number): void {
    this.router.navigate([`/admin/customers/edit/${customerId}`]);
  }

  async deleteCustomer(customer: Customer): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Eliminar Cliente',
      message: `¿Está seguro que desea eliminar al cliente ${customer.nombreCompleto || 'seleccionado'}? Esta acción no se puede deshacer.`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.executeDeleteCustomer(customer);
          }
        }
      ]
    });

    await alert.present();
  }

  private executeDeleteCustomer(customer: Customer): void {
    this.customerService.deleteCustomer(customer.id.toString()).subscribe({
      next: (response) => {
        if (response.success) {
          // Remover el cliente de la lista local
          const customers = this.customers().filter(c => c.id !== customer.id);
          this.customers.set(customers);
          this.filterCustomers();
          this.toastService.success('Cliente eliminado exitosamente');
        } else {
          this.toastService.error(response.message || 'Error al eliminar cliente');
        }
      },
      error: () => {
        this.toastService.error('Error al eliminar cliente');
      }
    });
  }

  async openCreateAccountForCustomer(customer: Customer) {
    const alert = await this.alertController.create({
      header: `Nueva Cuenta para ${customer.nombreCompleto || 'Cliente'}`,
      inputs: [
        {
          name: 'tipo',
          type: 'text',
          placeholder: 'Tipo de Cuenta (Ahorros, Corriente, etc.)'
        },
        {
          name: 'moneda',
          type: 'text',
          placeholder: 'Moneda (CRC o USD)'
        },
        {
          name: 'saldoInicial',
          type: 'number',
          placeholder: 'Saldo Inicial',
          min: 0
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Crear Cuenta',
          handler: async (data) => {
            if (!data.tipo || !data.moneda || !data.saldoInicial) {
              await this.toastService.warning('Complete todos los campos');
              return false;
            }

            await this.createAccount(customer, data);
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  async createAccount(customer: Customer, accountData: any) {
    try {
      await this.toastService.success('Cuenta creada exitosamente');
      // Actualizar el cliente localmente
      const customers = this.customers().map(c =>
        c.id === customer.id
          ? { ...c, cuentasActivas: (c.cuentasActivas || 0) + 1 }
          : c
      );
      this.customers.set(customers);
      this.filterCustomers();
    } catch (error) {
      console.error('Error al crear la cuenta:', error);
      await this.toastService.error('Error al crear la cuenta');
    }
  }

  handleRefresh(event: any): void {
    this.loadCustomers();
    event.target.complete();
  }

  goBack(): void {
    this.location.back();
  }
}
