import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Customer } from '../../models/customer.dto';
import { IonicModule, AlertController, ModalController } from '@ionic/angular';
import { ToastService } from '../../../../../../services/toast.service';
import { CustomerService } from '../../services/customer.service';
import { CustomerDetailComponent } from '../customer-detail/customer-detail.component';
import { CustomerAccountsComponent } from '../customer-accounts/customer-accounts.component';
import { CustomerTransactionsComponent } from '../customer-transactions/customer-transactions.component';

@Component({
  selector: 'app-customer-list',
  templateUrl: './customer-list.component.html',
  styleUrls: ['./customer-list.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, RouterModule]
})
export class CustomerListComponent implements OnInit {
  // Signals para estado reactivo
  customers = signal<Customer[]>([]);
  filteredCustomers = signal<Customer[]>([]);
  searchTerm = signal('');
  isLoading = signal(false);

  // Signal computado para estadísticas
  stats = computed(() => {
    const customers = this.customers();
    return {
      totalCustomers: customers.length,
      totalAccounts: customers.reduce((sum, customer) => sum + customer.cuentasActivas, 0),
      totalVolume: customers.reduce((sum, customer) => sum + customer.volumenTotal, 0)
    };
  });

  constructor(
    private alertController: AlertController,
    private modalController: ModalController,
    private router: Router,
    private toastService: ToastService,
    private customerService: CustomerService
  ) {}

  ngOnInit() {
    this.loadCustomers();
  }

  async loadCustomers() {
    this.isLoading.set(true);
    try {
      // Datos simulados - todos los clientes del sistema
      const mockCustomers: Customer[] = [
        {
          id: '1',
          nombre: 'Carlos Sánchez Mora',
          email: 'carlos.sanchez@email.com',
          identificacion: '1-1234-5678',
          telefono: '8888-9999',
          cuentasActivas: 3,
          ultimaOperacion: new Date('2025-11-07'),
          estado: 'Activo',
          volumenTotal: 5600000
        },
        {
          id: '2',
          nombre: 'Ana Rodríguez Pérez',
          email: 'ana.rodriguez@email.com',
          identificacion: '2-2345-6789',
          telefono: '7777-8888',
          cuentasActivas: 2,
          ultimaOperacion: new Date('2025-11-06'),
          estado: 'Activo',
          volumenTotal: 3200000
        },
        {
          id: '3',
          nombre: 'José Martínez López',
          email: 'jose.martinez@email.com',
          identificacion: '3-3456-7890',
          telefono: '6666-7777',
          cuentasActivas: 4,
          ultimaOperacion: new Date('2025-11-05'),
          estado: 'Activo',
          volumenTotal: 8900000
        },
        {
          id: '4',
          nombre: 'María Fernández Castro',
          email: 'maria.fernandez@email.com',
          identificacion: '4-4567-8901',
          telefono: '5555-6666',
          cuentasActivas: 1,
          ultimaOperacion: new Date('2025-10-28'),
          estado: 'Activo',
          volumenTotal: 1200000
        },
        {
          id: '5',
          nombre: 'Pedro Ramírez Solís',
          email: 'pedro.ramirez@email.com',
          identificacion: '5-5678-9012',
          telefono: '4444-5555',
          cuentasActivas: 2,
          ultimaOperacion: new Date('2025-11-03'),
          estado: 'Activo',
          volumenTotal: 4500000
        },
        {
          id: '6',
          nombre: 'Laura Herrera Vargas',
          email: 'laura.herrera@email.com',
          identificacion: '6-6789-0123',
          telefono: '3333-4444',
          cuentasActivas: 3,
          ultimaOperacion: new Date('2025-11-02'),
          estado: 'Activo',
          volumenTotal: 6700000
        },
        {
          id: '7',
          nombre: 'Diego Torres Jiménez',
          email: 'diego.torres@email.com',
          identificacion: '7-7890-1234',
          telefono: '2222-3333',
          cuentasActivas: 2,
          ultimaOperacion: new Date('2025-10-25'),
          estado: 'Inactivo',
          volumenTotal: 890000
        },
        {
          id: '8',
          nombre: 'Sofía Campos Rojas',
          email: 'sofia.campos@email.com',
          identificacion: '8-8901-2345',
          telefono: '1111-2222',
          cuentasActivas: 5,
          ultimaOperacion: new Date('2025-11-08'),
          estado: 'Activo',
          volumenTotal: 12400000
        },
        {
          id: '9',
          nombre: 'Roberto Méndez Ortiz',
          email: 'roberto.mendez@email.com',
          identificacion: '9-9012-3456',
          telefono: '9999-0000',
          cuentasActivas: 1,
          ultimaOperacion: new Date('2025-10-15'),
          estado: 'Activo',
          volumenTotal: 650000
        },
        {
          id: '10',
          nombre: 'Gabriela Castro Monge',
          email: 'gabriela.castro@email.com',
          identificacion: '1-0123-4567',
          telefono: '8888-7777',
          cuentasActivas: 3,
          ultimaOperacion: new Date('2025-11-04'),
          estado: 'Activo',
          volumenTotal: 7800000
        }
      ];

      this.customers.set(mockCustomers);
      this.filteredCustomers.set(mockCustomers);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
      await this.toastService.error('Error al cargar clientes');
    } finally {
      this.isLoading.set(false);
    }
  }

  filterCustomers() {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) {
      this.filteredCustomers.set(this.customers());
      return;
    }

    const filtered = this.customers().filter(customer =>
      customer.nombre.toLowerCase().includes(term) ||
      customer.email.toLowerCase().includes(term) ||
      customer.identificacion.includes(term)
    );

    this.filteredCustomers.set(filtered);
  }

  async openCustomerDetail(customer: Customer) {
    const modal = await this.modalController.create({
      component: CustomerDetailComponent,
      componentProps: {
        customer: customer,
      },
      cssClass: 'custom-modal-size',
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data?.action === 'viewAccounts') {
      this.viewCustomerAccounts(customer);
    } else if (data?.action === 'viewTransactions') {
      this.viewCustomerTransactions(customer);
    }
  }

  async viewCustomerAccounts(customer: Customer) {
    const modal = await this.modalController.create({
      component: CustomerAccountsComponent,
      componentProps: {
        customer: customer
      },
      cssClass: 'custom-modal-size'
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data?.action === 'openNewAccount') {
      this.openCreateAccountForCustomer(customer);
    }
  }

  async viewCustomerTransactions(customer: Customer) {
    const modal = await this.modalController.create({
      component: CustomerTransactionsComponent,
      componentProps: {
        customer: customer
      },
      cssClass: 'custom-modal-size'
    });

    await modal.present();
  }

  async openCreateAccountModal() {
    const customers = this.customers();
    const alert = await this.alertController.create({
      header: 'Seleccionar Cliente',
      message: 'Seleccione el cliente para abrir una nueva cuenta',
      inputs: customers.map(customer => ({
        type: 'radio' as const,
        label: customer.nombre,
        value: customer.id
      })),
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Siguiente',
          handler: (customerId) => {
            if (customerId) {
              const customer = customers.find(c => c.id === customerId);
              if (customer) {
                this.openCreateAccountForCustomer(customer);
              }
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async openCreateAccountForCustomer(customer: Customer) {
    const alert = await this.alertController.create({
      header: `Nueva Cuenta para ${customer.nombre}`,
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
          ? { ...c, cuentasActivas: c.cuentasActivas + 1 }
          : c
      );
      this.customers.set(customers);
      this.filteredCustomers.set(customers.filter(c =>
        this.searchTerm().trim() === '' ||
        c.nombre.toLowerCase().includes(this.searchTerm().toLowerCase()) ||
        c.email.toLowerCase().includes(this.searchTerm().toLowerCase()) ||
        c.identificacion.includes(this.searchTerm())
      ));
    } catch (error) {
      console.error('Error al crear la cuenta:', error);
      await this.toastService.error('Error al crear la cuenta');
    }
  }

  async handleRefresh(event: any) {
    await this.loadCustomers();
    event.target.complete();
  }
}