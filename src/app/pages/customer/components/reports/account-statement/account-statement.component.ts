import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { IonicModule, AlertController } from '@ionic/angular';
import { ToastService } from '../../../../../services/toast.service';
import { CustomerReportsService } from '../../../services/customer-reports.service';
import { CustomerAccountsService } from '../../../services/customer-accounts.service';
import { ExtractoCuentaDto } from '../../../model/report.model';
import { CuentaListaDto } from '../../../model/account.model';

@Component({
  selector: 'app-account-statement',
  templateUrl: './account-statement.component.html',
  styleUrls: ['./account-statement.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class AccountStatementComponent implements OnInit {
  // Datos
  myAccounts = signal<CuentaListaDto[]>([]);
  statement = signal<ExtractoCuentaDto | null>(null);

  // Formulario
  accountId = signal<number | null>(null);
  startDate = signal<string>(this.getDefaultStartDate());
  endDate = signal<string>(this.getDefaultEndDate());

  // Estado
  isLoading = signal(false);
  isExporting = signal(false);

  // Computed
  selectedAccount = computed(() => {
    const id = this.accountId();
    return this.myAccounts().find(c => c.id === id) || null;
  });

  constructor(
    private alertController: AlertController,
    private route: ActivatedRoute,
    private location: Location,
    private toastService: ToastService,
    private reportsService: CustomerReportsService,
    private accountsService: CustomerAccountsService
  ) {}

  ngOnInit() {
    this.loadAccounts();

    // Verificar si viene con cuenta pre-seleccionada
    const accountIdParam = this.route.snapshot.paramMap.get('cuentaId');
    if (accountIdParam) {
      this.accountId.set(+accountIdParam);
    }
  }

  private getDefaultStartDate(): string {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  }

  private getDefaultEndDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  loadAccounts(): void {
    this.accountsService.getMisCuentas().subscribe({
      next: (response: any) => {
        if (response.success) {
          this.myAccounts.set(response.data || []);

          // Si hay una cuenta pre-seleccionada, cargar extracto
          if (this.accountId()) {
            this.loadStatement();
          }
        }
      },
      error: () => this.toastService.error('Error al cargar cuentas')
    });
  }

  loadStatement(): void {
    if (!this.accountId()) {
      this.toastService.warning('Seleccione una cuenta');
      return;
    }

    this.isLoading.set(true);

    this.reportsService.getAccountStatement(
      this.accountId()!,
      this.startDate(),
      this.endDate()
    ).subscribe({
      next: (response) => {
        if (response.success) {
          this.statement.set(response.data || null);
        } else {
          this.toastService.error(response.message || 'Error al cargar extracto');
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.error('Error al cargar extracto');
        this.isLoading.set(false);
      }
    });
  }

  async export(format: 'pdf' | 'csv'): Promise<void> {
    if (!this.accountId()) {
      this.toastService.warning('Seleccione una cuenta');
      return;
    }

    this.isExporting.set(true);

    this.reportsService.getStatementAsBlob(
      this.accountId()!,
      this.startDate(),
      this.endDate(),
      format
    ).subscribe({
      next: (blob) => {
        const filename = `extracto_${this.selectedAccount()?.numero}_${this.startDate()}_${this.endDate()}.${format}`;
        this.reportsService.downloadFile(blob, filename);
        this.toastService.success(`Extracto descargado en formato ${format.toUpperCase()}`);
        this.isExporting.set(false);
      },
      error: () => {
        this.toastService.error('Error al descargar extracto');
        this.isExporting.set(false);
      }
    });
  }

  goBack(): void {
    this.location.back();
  }

  formatCurrency(amount: number | undefined, moneda: string = 'CRC'): string {
    if (amount === undefined) return '-';
    const symbol = moneda === 'USD' ? '$' : '₡';
    return `${symbol}${amount.toLocaleString('es-CR', { minimumFractionDigits: 2 })}`;
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-CR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  getMovementColor(tipo: string): string {
    return tipo === 'Credito' ? 'success' : 'danger';
  }

  getMovementIcon(tipo: string): string {
    return tipo === 'Credito' ? 'arrow-down-outline' : 'arrow-up-outline';
  }
}
