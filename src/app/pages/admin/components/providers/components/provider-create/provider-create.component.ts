import { Component, OnInit, computed, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ProviderService } from '../../../../../../services/provider.service';
import { ToastService } from '../../../../../../services/toast.service';
import { FormValidationService } from '../../../../../../services/form-validation.service';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule, Location } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-provider-create',
  templateUrl: './provider-create.component.html',
  styleUrls: ['./provider-create.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonicModule,
  ],
})
export class ProviderCreateComponent implements OnInit {
  // FormGroup inicializado directamente
  providerForm!: FormGroup;

  // Signals para estado reactivo
  isLoading = signal(false);
  isEditMode = signal(false);
  providerId = signal<number | null>(null);

  // Signals computados
  title = computed(() => this.isEditMode() ? 'Editar Proveedor' : 'Crear Proveedor');
  submitButtonText = computed(() => this.isEditMode() ? 'Actualizar Proveedor' : 'Crear Proveedor');
  submitLoadingText = computed(() => this.isEditMode() ? 'Actualizando...' : 'Creando...');

  constructor(
    private formBuilder: FormBuilder,
    private providerService: ProviderService,
    private toastService: ToastService,
    private formValidationService: FormValidationService,
    private router: Router,
    private route: ActivatedRoute,
    private location: Location,
  ) {}

  ngOnInit() {
    this.initializeComponent();
  }

  private initializeComponent(): void {
    const id = this.route.snapshot.paramMap.get('id');

    // Determinar modo y configurar signals
    if (id) {
      this.isEditMode.set(true);
      this.providerId.set(Number(id));
    }

    // Inicializar formulario
    this.providerForm = this.createForm();

    // Cargar datos si es modo edición
    if (id) {
      this.loadProviderData(Number(id));
    }
  }

  loadProviderData(id: number) {
    this.isLoading.set(true);
    this.providerService.getProviderById(id).subscribe({
      next: (response: any) => {
        if (response.success && this.providerForm) {
          this.providerForm.patchValue({
            nombre: response.data.nombre,
            reglaValidacionContrato: response.data.reglaValidacionContrato,
            formatoContrato: response.data.formatoContrato,
          });
        } else {
          this.toastService.error('Error al cargar datos del proveedor');
          this.location.back();
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.error('Error al cargar datos del proveedor');
        this.location.back();
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Crea el formulario reactivo para crear/editar proveedor
   */
  private createForm(): FormGroup {
    return this.formBuilder.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      reglaValidacionContrato: ['', [Validators.required, Validators.minLength(3)]],
      formatoContrato: ['', [Validators.required, Validators.minLength(3)]],
    });
  }

  saveProvider(): void {
    // Validar formulario
    if (!this.providerForm || this.providerForm.invalid) {
      this.markFormAsTouched();
      this.toastService.warning('Por favor, complete todos los campos requeridos correctamente');
      return;
    }

    this.isLoading.set(true);

    // Extraer valores del formulario
    const formValues = this.providerForm.value;

    // Construir providerData según el modo
    const providerData = {
      nombre: formValues.nombre,
      reglaValidacionContrato: formValues.reglaValidacionContrato,
      formatoContrato: formValues.formatoContrato,
      ...(this.isEditMode() ? { id: this.providerId() } : {})
    };

    // Ejecutar acción según modo
    this.isEditMode() ? this.updateProvider(providerData) : this.createProvider(providerData);
  }

  private createProvider(providerData: any): void {
    this.providerService.createProvider(providerData).subscribe({
      next: (response) => this.handleApiResponse(response, 'Proveedor creado exitosamente', 'Error al crear el proveedor'),
      error: (error) => this.handleApiError(error?.message || 'Error al crear el proveedor. Intente nuevamente.')
    });
  }

  private updateProvider(providerData: any): void {
    this.providerService.updateProvider(providerData).subscribe({
      next: (response) => this.handleApiResponse(response, 'Proveedor actualizado exitosamente', 'Error al actualizar el proveedor'),
      error: (error) => this.handleApiError(error?.message || 'Error al actualizar el proveedor. Intente nuevamente.')
    });
  }

  /**
   * Marca todos los campos del formulario como tocados para mostrar errores
   */
  private markFormAsTouched(): void {
    if (this.providerForm) {
      Object.keys(this.providerForm.controls).forEach(key => {
        this.providerForm.get(key)?.markAsTouched();
      });
    }
  }

  /**
   * Maneja respuestas de API de forma centralizada
   */
  private handleApiResponse(response: any, successMessage: string, warningMessage: string): void {
    if (response.success) {
      if (!this.isEditMode()) {
        this.providerForm.reset();
      }
      this.toastService.success(successMessage);
      this.location.back();
    } else {
      this.toastService.warning(response.message || warningMessage);
    }
    this.isLoading.set(false);
  }

  /**
   * Maneja errores de API de forma centralizada
   */
  private handleApiError(errorMessage: string): void {
    this.toastService.error(errorMessage);
    this.isLoading.set(false);
  }

  /**
   * Navega de vuelta a la lista de proveedores
   */
  goBack(): void {
    this.location.back();
  }

  /**
   * Verifica si un campo tiene errores específicos
   */
  hasError(field: string, error: string): boolean {
    if (!this.providerForm) {
      return false;
    }
    return this.formValidationService.isFieldInvalid(this.providerForm, field, error) ?? false;
  }

  /**
   * Obtiene el mensaje de error para un campo específico
   */
  getErrorMessage(field: string): string {
    if (!this.providerForm) {
      return '';
    }

    const control = this.providerForm.get(field);

    if (control?.errors) {
      if (control.errors['required']) {
        return 'Este campo es requerido';
      }
      if (control.errors['minlength']) {
        return `Mínimo ${control.errors['minlength'].requiredLength} caracteres`;
      }
    }

    return '';
  }
}
