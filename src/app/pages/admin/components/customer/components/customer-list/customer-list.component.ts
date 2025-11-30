import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Client } from '../../models/customer.dto';
import { IonicModule, AlertController, ToastController, ModalController } from '@ionic/angular';
import { CustomerDetailComponent } from '../customer-detail/customer-detail.component';
import { CustomerAccountsComponent } from '../customer-accounts/customer-accounts.component';
import { CustomerTransactionsComponent } from '../customer-transactions/customer-transactions.component';

@Component({
  selector: 'app-customer-list',
  templateUrl: './customer-list.component.html',
  styleUrls: ['./customer-list.component.scss'],
   imports: [CommonModule, FormsModule, IonicModule, RouterModule]
})
export class CustomerListComponent  implements OnInit {
 clients: Client[] = [];
  filteredClients: Client[] = [];
  searchTerm: string = '';
  isLoading = false;

  stats = {
    totalClients: 0,
    totalAccounts: 0,
    totalVolume: 0
  };

  constructor(
    private alertController: AlertController,
    private toastController: ToastController,
    private modalController: ModalController,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadClients();
  }

  async loadClients() {
    this.isLoading = true;
    try {
      // Datos simulados - todos los clientes del sistema
      this.clients = [
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

      this.filteredClients = [...this.clients];
      this.calculateStats();
    } catch (error) {
      console.error('Error loading clients:', error);
      await this.showToast('Error al cargar clientes', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  calculateStats() {
    this.stats.totalClients = this.clients.length;
    this.stats.totalAccounts = this.clients.reduce((sum, client) => sum + client.cuentasActivas, 0);
    this.stats.totalVolume = this.clients.reduce((sum, client) => sum + client.volumenTotal, 0);
  }

  filterClients() {
    if (!this.searchTerm.trim()) {
      this.filteredClients = [...this.clients];
      return;
    }

    const term = this.searchTerm.toLowerCase();
    this.filteredClients = this.clients.filter(client =>
      client.nombre.toLowerCase().includes(term) ||
      client.email.toLowerCase().includes(term) ||
      client.identificacion.includes(term)
    );
  }

  async openClientDetail(client: Client) {
    const modal = await this.modalController.create({
      component: CustomerDetailComponent,
      componentProps: {
        client: client,
      },
      cssClass: 'custom-modal-size',
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data?.action === 'viewAccounts') {
      this.viewClientAccounts(client);
    } else if (data?.action === 'viewTransactions') {
      this.viewClientTransactions(client);
    }
  }

  async viewClientAccounts(client: Client) {
    const modal = await this.modalController.create({
      component: CustomerAccountsComponent,
      componentProps: {
        client: client
      },
      cssClass: 'custom-modal-size'
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data?.action === 'openNewAccount') {
      this.openCreateAccountForClient(client);
    }
  }

  async viewClientTransactions(client: Client) {
    const modal = await this.modalController.create({
      component: CustomerTransactionsComponent,
      componentProps: {
        client: client
      },
      cssClass: 'custom-modal-size'
    });

    await modal.present();
  }

  async openCreateAccountModal() {
    const alert = await this.alertController.create({
      header: 'Seleccione Cliente',
      message: 'Seleccione el cliente para abrir una nueva cuenta',
      inputs: this.clients.map(client => ({
        type: 'radio' as const,
        label: client.nombre,
        value: client.id
      })),
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Siguiente',
          handler: (clientId) => {
            if (clientId) {
              const client = this.clients.find(c => c.id === clientId);
              if (client) {
                this.openCreateAccountForClient(client);
              }
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async openCreateAccountForClient(client: Client) {
    const alert = await this.alertController.create({
      header: `Nueva Cuenta para ${client.nombre}`,
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
              await this.showToast('Complete todos los campos', 'warning');
              return false;
            }

            await this.createAccount(client, data);
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  async createAccount(client: Client, accountData: any) {
    try {
      await this.showToast('Cuenta creada exitosamente', 'success');
      client.cuentasActivas++;
      this.calculateStats();
    } catch (error) {
      console.error('Error creating account:', error);
      await this.showToast('Error al crear la cuenta', 'danger');
    }
  }

  async handleRefresh(event: any) {
    await this.loadClients();
    event.target.complete();
  }

  private async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message,
      duration: 2500,
      position: 'top',
      color
    });
    await toast.present();
  }

}
