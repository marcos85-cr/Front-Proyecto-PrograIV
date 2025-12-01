import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { IonicModule, AlertController } from '@ionic/angular';
import { ToastService } from '../../../../../services/toast.service';
import { ReportesClienteService } from '../../../services/reportes-cliente.service';
import { CuentasClienteService } from '../../../services/cuentas-cliente.service';
import { ExtractoCuentaDto } from '../../../model/reporte.model';
import { CuentaListaDto } from '../../../model/cuenta.model';

@Component({
  selector: 'app-extracto-cuenta',
  templateUrl: './extracto-cuenta.component.html',
  styleUrls: ['./extracto-cuenta.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class ExtractoCuentaComponent implements OnInit {
  // Datos
  misCuentas = signal<CuentaListaDto[]>([]);
  extracto = signal<ExtractoCuentaDto | null>(null);

  // Formulario
  cuentaId = signal<number | null>(null);
  fechaInicio = signal<string>(this.getDefaultStartDate());
  fechaFin = signal<string>(this.getDefaultEndDate());

  // Estado
  isLoading = signal(false);
  isExporting = signal(false);

  // Computed
  cuentaSeleccionada = computed(() => {
    const id = this.cuentaId();
    return this.misCuentas().find(c => c.id === id) || null;
  });

  constructor(
    private alertController: AlertController,
    private route: ActivatedRoute,
    private location: Location,
    private toastService: ToastService,
    private reportesService: ReportesClienteService,
    private cuentasService: CuentasClienteService
  ) {}

  ngOnInit() {
    this.loadCuentas();

    // Verificar si viene con cuenta pre-seleccionada
    const cuentaIdParam = this.route.snapshot.paramMap.get('cuentaId');
    if (cuentaIdParam) {
      this.cuentaId.set(+cuentaIdParam);
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

  loadCuentas(): void {
    this.cuentasService.getMisCuentas().subscribe({
      next: (response) => {
        if (response.success) {
          this.misCuentas.set(response.data || []);

          // Si hay una cuenta pre-seleccionada, cargar extracto
          if (this.cuentaId()) {
            this.cargarExtracto();
          }
        }
      },
      error: () => this.toastService.error('Error al cargar cuentas')
    });
  }

  cargarExtracto(): void {
    if (!this.cuentaId()) {
      this.toastService.warning('Seleccione una cuenta');
      return;
    }

    this.isLoading.set(true);

    this.reportesService.getExtractoCuenta(
      this.cuentaId()!,
      this.fechaInicio(),
      this.fechaFin()
    ).subscribe({
      next: (response) => {
        if (response.success) {
          this.extracto.set(response.data || null);
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

  async exportar(formato: 'pdf' | 'csv'): Promise<void> {
    if (!this.cuentaId()) {
      this.toastService.warning('Seleccione una cuenta');
      return;
    }

    this.isExporting.set(true);

    this.reportesService.getExtractoAsBlob(
      this.cuentaId()!,
      this.fechaInicio(),
      this.fechaFin(),
      formato
    ).subscribe({
      next: (blob) => {
        const filename = `extracto_${this.cuentaSeleccionada()?.numero}_${this.fechaInicio()}_${this.fechaFin()}.${formato}`;
        this.reportesService.descargarArchivo(blob, filename);
        this.toastService.success(`Extracto descargado en formato ${formato.toUpperCase()}`);
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

  getMovimientoColor(tipo: string): string {
    return tipo === 'Credito' ? 'success' : 'danger';
  }

  getMovimientoIcon(tipo: string): string {
    return tipo === 'Credito' ? 'arrow-down-outline' : 'arrow-up-outline';
  }
}
