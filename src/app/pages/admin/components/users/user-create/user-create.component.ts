import { Component, OnInit, computed, signal, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { UserService } from '../../../../../services/user.service';
import { ToastService } from '../../../../../services/toast.service';
import { FormValidationService } from '../../../../../services/form-validation.service';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { AVAILABLE_ROLES, USER_ROLES } from '../../../../../shared/constants/user-roles.constants';

@Component({
  selector: 'app-user-create',
  templateUrl: './user-create.component.html',
  styleUrls: ['./user-create.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonicModule,
  ],
})
export class UserCreateComponent implements OnInit {
  // FormGroup inicializado directamente (no puede ser null para el template)
  userForm!: FormGroup;

  // Signals para estado reactivo
  isLoading = signal(false);
  isEditMode = signal(false);
  userId = signal<string | null>(null);

  // Signals computados
  title = computed(() => this.isEditMode() ? 'Editar Usuario' : 'Crear Usuario');
  submitButtonText = computed(() => this.isEditMode() ? 'Actualizar Usuario' : 'Crear Usuario');
  submitLoadingText = computed(() => this.isEditMode() ? 'Actualizando Usuario...' : 'Creando Usuario...');

  // Constantes
  roles = AVAILABLE_ROLES;
  readonly USER_ROLES = USER_ROLES;

  constructor(
    private formBuilder: FormBuilder,
    private userService: UserService,
    private toastService: ToastService,
    private formValidationService: FormValidationService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.initializeComponent();
  }

  private initializeComponent(): void {
    const id = this.route.snapshot.paramMap.get('id');

    // Determinar modo y configurar signals
    if (id) {
      this.isEditMode.set(true);
      this.userId.set(id);
    }

    // Inicializar formulario
    this.userForm = this.createForm();

    // Cargar datos si es modo edición
    if (id) {
      this.loadUserData(id);
    }
  }

  loadUserData(id: string) {
    this.isLoading.set(true);
    this.userService.getUserById(id).subscribe({
      next: (response: any) => {
        if (response.success && this.userForm) {
          this.userForm.patchValue({
            nombre: response.data.nombre,
            email: response.data.email,
            identificacion: response.data.identificacion,
            telefono: response.data.telefono,
            role: response.data.role
          });
        } else {
          this.toastService.error('Error al cargar datos del usuario');
          this.router.navigate(['/admin/users']);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.error('Error al cargar datos del usuario');
        this.router.navigate(['/admin/users']);
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Crea el formulario reactivo para crear usuario
   */
  private createForm(): FormGroup {
    const isEdit = this.isEditMode();

    const formConfig = {
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      identificacion: ['', [Validators.required, Validators.minLength(5)]],
      telefono: ['', [Validators.required, Validators.pattern(/^[0-9]{8,15}$/)]],
      role: [USER_ROLES.CLIENTE, Validators.required]
    };

    // Solo agregar y requerir passwords en modo creación
    if (!isEdit) {
      (formConfig as any)['password'] = ['', [Validators.required, Validators.minLength(6)]];
      (formConfig as any)['confirmPassword'] = ['', Validators.required];
    }

    return this.formBuilder.group(formConfig, {
      validators: !isEdit ? this.passwordMatchValidator : undefined
    });
  }

  /**
   * Validador personalizado para confirmación de password
   */
  private passwordMatchValidator = (control: AbstractControl): { [key: string]: any } | null => {
    const formGroup = control as FormGroup;
    const password = formGroup.get('password')?.value;
    const confirmPassword = formGroup.get('confirmPassword')?.value;

    if (password && confirmPassword && password !== confirmPassword) {
      return { passwordMismatch: true };
    }

    return null;
  };

  saveUser(): void {
    // Validar formulario
    if (!this.userForm || this.userForm.invalid) {
      this.markFormAsTouched();
      this.toastService.warning('Por favor, complete todos los campos requeridos correctamente');
      return;
    }

    this.isLoading.set(true);

    // Extraer valores del formulario
    const formValues = this.userForm.value;

    // Construir userData según el modo
    const userData = {
      nombre: formValues.nombre,
      email: formValues.email,
      identificacion: formValues.identificacion,
      telefono: formValues.telefono,
      role: formValues.role,
      ...(this.isEditMode() ? { id: this.userId() } : {
        password: formValues.password,
        confirmPassword: formValues.confirmPassword
      })
    };

    // Ejecutar acción según modo
    this.isEditMode() ? this.updateUser(userData) : this.createUser(userData);
  }

  private createUser(userData: any): void {
    this.userService.createUser(userData).subscribe({
      next: (response) => this.handleApiResponse(response, 'Usuario creado exitosamente', 'Error al crear el usuario'),
      error: (error) => this.handleApiError(error?.message || 'Error al crear el usuario. Intente nuevamente.')
    });
  }

  private updateUser(userData: any): void {
    this.userService.updateUser(userData).subscribe({
      next: (response) => this.handleApiResponse(response, 'Usuario actualizado exitosamente', 'Error al actualizar el usuario'),
      error: (error) => this.handleApiError(error?.message || 'Error al actualizar el usuario. Intente nuevamente.')
    });
  }

  /**
   * Marca todos los campos del formulario como tocados para mostrar errores
   */
  private markFormAsTouched(): void {
    if (this.userForm) {
      Object.keys(this.userForm.controls).forEach(key => {
        this.userForm.get(key)?.markAsTouched();
      });
    }
  }

  /**
   * Maneja respuestas de API de forma centralizada
   */
  private handleApiResponse(response: any, successMessage: string, warningMessage: string): void {
    if (response.success) {
      if (!this.isEditMode()) {
        this.userForm.reset();
      }
      this.toastService.success(successMessage);
      this.router.navigate(['/admin/users']);
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
   * Navega de vuelta a la lista de usuarios
   */
  goBack(): void {
    this.router.navigate(['/admin/users']);
  }

  /**
   * Verifica si un campo tiene errores específicos
   */
  hasError(field: string, error: string): boolean {
    // Verificar que el formulario existe
    if (!this.userForm) {
      return false;
    }

    // En modo edición, los campos de contraseña no existen en el formulario
    if (this.isEditMode() && (field === 'password' || field === 'confirmPassword')) {
      return false;
    }

    return this.formValidationService.isFieldInvalid(this.userForm, field, error) ?? false;
  }

  /**
   * Obtiene el mensaje de error para un campo específico
   */
  getErrorMessage(field: string): string {
    if (!this.userForm) {
      return '';
    }

    const control = this.userForm.get(field);

    if (control?.errors) {
      if (control.errors['required']) {
        return 'Este campo es requerido';
      }
      if (control.errors['email']) {
        return 'Ingrese un email válido';
      }
      if (control.errors['minlength']) {
        return `Mínimo ${control.errors['minlength'].requiredLength} caracteres`;
      }
      if (control.errors['pattern']) {
        return 'Formato inválido';
      }
      if (control.errors['passwordMismatch']) {
        return 'Las contraseñas no coinciden';
      }
    }

    return '';
  }
}
