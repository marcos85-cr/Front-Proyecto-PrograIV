import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { CustomerService } from '../../services/customer.service';
import { ToastService } from '../../../../../../services/toast.service';
import { catchError, finalize, tap } from 'rxjs/operators';
import { EMPTY } from 'rxjs';

export interface CustomerDetail {
  id: number;
  usuarioId: number;
  identificacion: string;
  nombreCompleto: string;
  telefono: string;
  email: string;
  direccion: string;
  fechaNacimiento: string;
  estado: string;
  fechaRegistro: string;
  cuentasActivas: number;
  saldoTotal: number;
  usuario?: {
    id: number;
    email: string;
    nombre: string;
    identificacion: string;
    telefono: string;
    rol: string;
    estaBloqueado: boolean;
  };
  gestor?: {
    id: number;
    nombre: string;
    email: string;
  };
  cuentas: {
    id: number;
    numero: string;
    tipo: string;
    moneda: string;
    saldo: number;
    estado: string;
  }[];
}

@Component({
  selector: 'app-customer-detail',
  templateUrl: './customer-detail.component.html',
  styleUrls: ['./customer-detail.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
})
export class CustomerDetailComponent implements OnInit {
  customer = signal<CustomerDetail | null>(null);
  isLoading = signal(false);
  customerId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private customerService: CustomerService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.customerId = this.route.snapshot.paramMap.get('id');
    if (this.customerId) {
      this.loadCustomer(this.customerId);
    } else {
      this.toastService.error('ID de cliente no válido');
      this.goBack();
    }
  }

  loadCustomer(id: string): void {
    this.isLoading.set(true);
    this.customerService.getCustomerById(id).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.customer.set(response.data);
        } else {
          this.toastService.error('Cliente no encontrado');
          this.goBack();
        }
      }),
      catchError(error => {
        this.toastService.error('Error al cargar el cliente');
        this.goBack();
        return EMPTY;
      }),
      finalize(() => this.isLoading.set(false))
    ).subscribe();
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'No disponible';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  formatDateTime(dateString: string): string {
    if (!dateString) return 'No disponible';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatCurrency(amount: number, currency: string = 'CRC'): string {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: currency === 'USD' ? 'USD' : 'CRC'
    }).format(amount);
  }

  goBack(): void {
    this.router.navigate(['/admin/customers']);
  }

  goToEdit(): void {
    if (this.customerId) {
      this.router.navigate([`/admin/customers/edit/${this.customerId}`]);
    }
  }
}
