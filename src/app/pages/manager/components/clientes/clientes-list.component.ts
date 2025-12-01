import { Component, OnInit, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { catchError, finalize, tap } from 'rxjs/operators';
import { EMPTY, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { FormsModule } from '@angular/forms';

import { GestorService } from '../../../../services/gestor.service';
import { ToastService } from '../../../../services/toast.service';
import { AlertController, LoadingController } from '@ionic/angular';

import {
  ClienteGestor,
  ClienteFilters,
  ClientesResponse,
  Result
} from '../../../../shared/models/gestor.model';

@Component({
  selector: 'app-clientes-list',
  templateUrl: './clientes-list.component.html',
  styleUrls: ['./clientes-list.component.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
  ],
})
export class ClientesListComponent implements OnInit {
  // Signals
  clientes = signal<ClienteGestor[]>([]);
  filteredClientes = signal<ClienteGestor[]>([]);
  isLoading = signal(false);

  // Stats
  stats = signal({
    totalClients: 0,
    totalAccounts: 0,
    totalVolume: 0
  });

  // Pagination
  currentPage = signal(1);
  itemsPerPage = 10;
  totalItems = signal(0);

  // Search
  searchForm: FormGroup;

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  constructor(
    private gestorService: GestorService,
    private router: Router,
    private fb: FormBuilder,
    private toastService: ToastService,
    private alertController: AlertController,
    private loadingController: LoadingController
  ) {
    this.searchForm = this.fb.group({
      searchTerm: ['']
    });
  }

  ngOnInit() {
    this.loadClientes();
    this.setupSearch();
  }

  setupSearch() {
    let searchSubscription: Subscription | null = null;

    this.searchForm.get('searchTerm')?.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(term => {
      this.filterCliente(term);
    });
  }

  loadClientes(page: number = 1) {
    this.isLoading.set(true);
    this.currentPage.set(page);

    const filters: ClienteFilters = {
      page,
      limit: this.itemsPerPage
    };

    this.gestorService.getClientes(filters).pipe(
      tap(response => {
        if (response.success && response.data) {
          const clientesData = response.data;
          this.clientes.set(clientesData.data);
          this.filteredClientes.set(clientesData.data);
          this.stats.set(clientesData.stats);
          this.totalItems.set(clientesData.data.length);
        }
      }),
      catchError(error => {
        console.error('Error loading clientes:', error);
        this.toastService.error('Error al cargar clientes');
        return EMPTY;
      }),
      finalize(() => this.isLoading.set(false))
    ).subscribe();
  }

  filterCliente(term: string) {
    const clientes = this.clientes();
    if (!term.trim()) {
      this.filteredClientes.set(clientes);
      return;
    }

    const filtered = clientes.filter(cliente =>
      cliente.nombre.toLowerCase().includes(term.toLowerCase()) ||
      cliente.email?.toLowerCase().includes(term.toLowerCase()) ||
      cliente.identificacion.includes(term) ||
      cliente.telefono?.includes(term)
    );

    this.filteredClientes.set(filtered);
  }

  onSearch(event: any) {
    const term = event.target.value;
    this.filterCliente(term);
  }

  viewClienteDetail(clienteId: number) {
    this.router.navigate([`/gestor/clientes/${clienteId}`]);
  }

  async createAccountForClient(cliente: ClienteGestor) {
    this.router.navigate([`/gestor/clientes/${cliente.id}/crear-cuenta`]);
  }

  async refreshClientes(event: any) {
    await this.loadClientes();
    event.target.complete();
  }

  loadMoreClientes(event: any) {
    const nextPage = this.currentPage() + 1;

    const filters: ClienteFilters = {
      page: nextPage,
      limit: this.itemsPerPage
    };

    this.gestorService.getClientes(filters).pipe(
      tap(response => {
        if (response.success && response.data) {
          const newClientes = response.data.data;
          const allClientes = [...this.clientes(), ...newClientes];
          this.clientes.set(allClientes);
          this.filteredClientes.set(allClientes);
          this.currentPage.set(nextPage);
        }
      }),
      catchError(error => {
        console.error('Error loading more clientes:', error);
        this.toastService.error('Error al cargar más clientes');
        return EMPTY;
      }),
      finalize(() => event.target.complete())
    ).subscribe();
  }

  formatCurrency(amount: number, currency: string): string {
    const symbol = currency === 'CRC' ? '₡' : '$';
    return `${symbol}${amount.toLocaleString('es-CR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }

  formatDate(date: Date | string): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('es-CR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  getEstadoColor(estado: string): string {
    switch (estado?.toLowerCase()) {
      case 'activo':
        return 'success';
      case 'inactivo':
        return 'danger';
      case 'suspendido':
        return 'warning';
      default:
        return 'medium';
    }
  }

  // Computed properties
  hasClientes = computed(() => this.filteredClientes().length > 0);

  displayedClientes = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredClientes().slice(start, end);
  });

  totalPages = computed(() => Math.ceil(this.totalItems() / this.itemsPerPage));

  // Clear search
  clearSearch() {
    this.searchForm.get('searchTerm')?.setValue('');
    this.searchInput?.nativeElement?.focus();
  }

  // Go back
  goBack() {
    this.router.navigate(['/gestor/dashboard']);
  }
}