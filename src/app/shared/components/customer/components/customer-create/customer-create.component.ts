import {
  Component,
  OnInit,
  signal,
  computed,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule, Location } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ToastService } from '../../../../../services/toast.service';
import { CustomerService } from '../../services/customer.service';
import { AlertController } from '@ionic/angular';
import { catchError, finalize, tap } from 'rxjs/operators';
import { EMPTY, forkJoin } from 'rxjs';
import { USER_ROLES } from 'src/app/shared/constants/user-roles.constants';
import { Account } from '../../../../../pages/admin/components/accounts/models/account.dto';
import { AccountsService } from '../../../../../pages/admin/components/accounts/services/accounts.service';

// Constantes para tipos de cuenta y monedas
export const ACCOUNT_TYPES = [
  { value: 'Ahorro', label: 'Ahorro' },
  { value: 'Corriente', label: 'Corriente' },
] as const;

export const CURRENCIES = [
  { value: 'CRC', label: 'Colones (CRC)' },
  { value: 'USD', label: 'Dólares (USD)' },
] as const;

@Component({
  selector: 'app-customer-create',
  templateUrl: './customer-create.component.html',
  styleUrls: ['./customer-create.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule],
})
export class CustomerCreateComponent implements OnInit {
  @ViewChild('hiddenDateInput') hiddenDateInput!: ElementRef<HTMLInputElement>;

  customerForm: FormGroup;
  isLoading = signal(false);
  isEditMode = signal(false);
  customerId = signal<string | null>(null);

  // Lista de usuarios y gestores para el selector
  usuarios = signal<any[]>([]);
  gestores = signal<any[]>([]);

  // Opciones para selects
  accountTypes = ACCOUNT_TYPES;
  currencies = CURRENCIES;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private location: Location,
    private customerService: CustomerService,
    private toastService: ToastService,
    private alertController: AlertController,
    private accountsService: AccountsService,
  ) {
    this.customerForm = this.fb.group({
      direccion: ['', [Validators.required, Validators.minLength(5)]],
      fechaNacimiento: ['', Validators.required],
      usuarioId: [null, Validators.required],
      gestorId: [null],
      cuentas: this.fb.array([]),
    });
  }

  ngOnInit(): void {
    // Verificar si estamos en modo edición
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.customerId.set(id);
    }

    // Cargar usuarios y gestores primero, luego cargar el cliente si estamos en modo edición
    this.loadInitialData();
  }

  // Cargar datos iniciales (usuarios y gestores) antes de cargar el cliente
  private loadInitialData(): void {
    this.isLoading.set(true);

    forkJoin({
      usuarios: this.customerService.getUsuarios(),
      gestores: this.customerService.getGestores(),
    })
      .pipe(
        tap(({ usuarios, gestores }) => {
          // Cargar usuarios - filtrar por rol "Cliente"
          if (usuarios.success && usuarios.data) {
            const usersCustomer = usuarios.data.filter(
              (user: any) =>
                user.role === USER_ROLES.CLIENTE
            );
            console.log('Usuarios filtrados (Cliente):', usersCustomer);
            this.usuarios.set(usersCustomer || []);
          }

          // Cargar gestores - filtrar por rol "Gestor"
          if (gestores.success && gestores.data) {
            const gestoresManager = gestores.data.filter(
              (user: any) =>
                user.role === USER_ROLES.GESTOR
            );
            console.log('Gestores filtrados (Gestor):', gestoresManager);
            this.gestores.set(gestoresManager || []);
          }
        }),
        catchError((error) => {
          console.error('Error loading initial data:', error);
          return EMPTY;
        }),
        finalize(() => {
          // Una vez cargados usuarios y gestores, cargar el cliente si estamos en modo edición
          if (this.isEditMode() && this.customerId()) {
            this.loadCustomer(this.customerId()!);
          } else {
            this.isLoading.set(false);
          }
        })
      )
      .subscribe();
  }

  // Getter para el FormArray de cuentas
  get cuentas(): FormArray {
    return this.customerForm.get('cuentas') as FormArray;
  }

  // Crear un FormGroup para una cuenta
  createAccountFormGroup(account?: any): FormGroup {
    return this.fb.group({
      id: [account?.id || null],
      tipo: [account?.tipo || 'Ahorro', Validators.required],
      moneda: [account?.moneda || 'CRC', Validators.required],
      // Usar 'saldo' si existe (edición), sino 'saldoInicial' (creación)
      saldoInicial: [
        account?.saldo ?? account?.saldoInicial ?? 0,
        [Validators.required, Validators.min(0)],
      ],
    });
  }

  // Formatear fecha para el API (ISO string)
  formatDateForApi(date: string): string {
    if (!date) return '';
    return new Date(date).toISOString();
  }

  // Abrir el selector de fecha nativo
  openDatePicker(): void {
    if (this.hiddenDateInput?.nativeElement) {
      this.hiddenDateInput.nativeElement.showPicker();
    }
  }

  // Obtener el nombre del usuario vinculado (para modo edición)
  getUsuarioNombre(): string {
    const usuarioId = this.customerForm.get('usuarioId')?.value;
    if (!usuarioId) return 'Sin usuario vinculado';

    const usuario = this.usuarios().find((u) => u.id === usuarioId);
    return usuario ? `${usuario.nombre} - ${usuario.email}` : 'Usuario no encontrado';
  }

  // Obtener etiqueta del tipo de cuenta
  getAccountTypeLabel(value: string): string {
    const type = this.accountTypes.find((t) => t.value === value);
    return type ? type.label : value;
  }

  // Obtener etiqueta de la moneda
  getCurrencyLabel(value: string): string {
    const currency = this.currencies.find((c) => c.value === value);
    return currency ? currency.label : value;
  }

  // Manejar cambio de fecha desde el input hidden
  onDateChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.value) {
      // Formatear la fecha a formato legible dd/MM/yyyy
      const date = new Date(input.value);
      const formattedDate = date.toLocaleDateString('es-CR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
      this.customerForm.get('fechaNacimiento')?.setValue(input.value);
    }
  }

  // Agregar una nueva cuenta
  addAccount(): void {
    this.cuentas.push(this.createAccountFormGroup());
  }

  // Eliminar una cuenta
  async removeAccount(index: number): Promise<void> {
    const cuenta = this.cuentas.at(index).value;

    // Si la cuenta tiene ID (existe en BD), confirmar eliminación
    if (cuenta.id) {
      const alert = await this.alertController.create({
        header: 'Eliminar Cuenta',
        message:
          '¿Está seguro que desea eliminar esta cuenta? Esta acción no se puede deshacer.',
        buttons: [
          { text: 'Cancelar', role: 'cancel' },
          {
            text: 'Eliminar',
            role: 'destructive',
            handler: () => {
              this.executeDeleteAccount(cuenta);
            },
          },
        ],
      });
      await alert.present();
    } else {
      this.cuentas.removeAt(index);
    }
  }

   private executeDeleteAccount(account: Account): void {
      this.accountsService.deleteAccount(account.id.toString()).subscribe({
        next: () => {
          this.toastService.success('Cuenta eliminada exitosamente');
        },
        error: (error) => this.toastService.error(error?.message || 'Error al eliminar cuenta'),
      });
    }

  loadCustomer(id: string): void {
    this.isLoading.set(true);
    this.customerService
      .getCustomerById(id)
      .pipe(
        tap((response) => {
          if (response.success && response.data) {
            const customer = response.data;

            // Formatear fecha para el input date (yyyy-MM-dd)
            let fechaNacimiento = '';
            if (customer.fechaNacimiento) {
              const date = new Date(customer.fechaNacimiento);
              fechaNacimiento = date.toISOString().split('T')[0];
            }
            console.log('all usuarios', this.usuarios());
            // Obtener usuarioId y gestorId desde los objetos anidados
            const usuarioId = customer.usuario?.id || null;
            const gestorId = customer.gestor?.id || null;

            // Actualizar el formulario con los datos del cliente
            this.customerForm.patchValue({
              direccion: customer.direccion || '',
              fechaNacimiento: fechaNacimiento,
              usuarioId: usuarioId,
              gestorId: gestorId,
            });

            // Sincronizar el input hidden de fecha
            setTimeout(() => {
              if (this.hiddenDateInput?.nativeElement && fechaNacimiento) {
                this.hiddenDateInput.nativeElement.value = fechaNacimiento;
              }
            }, 100);

            // Cargar cuentas existentes
            this.cuentas.clear();
            if (customer.cuentas && customer.cuentas.length > 0) {
              customer.cuentas.forEach((cuenta: any) => {
                this.cuentas.push(this.createAccountFormGroup(cuenta));
              });
            }
          } else {
            this.toastService.error('Cliente no encontrado');
            this.goToCustomerList();
          }
        }),
        catchError((error) => {
          this.toastService.error('Error al cargar cliente');
          this.goToCustomerList();
          return EMPTY;
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe();
  }

  saveCustomer(): void {
    if (this.customerForm.invalid) {
      this.markFormGroupTouched(this.customerForm);
      this.toastService.warning(
        'Por favor, complete todos los campos requeridos'
      );
      return;
    }

    this.isLoading.set(true);
    const formData = this.customerForm.value;

    // Preparar datos según el formato del API
    // En modo edición, solo enviar cuentas nuevas (sin id)
    const cuentasToSend = this.isEditMode()
      ? formData.cuentas
          .filter((cuenta: any) => !cuenta.id)
          .map((cuenta: any) => ({
            tipo: cuenta.tipo,
            moneda: cuenta.moneda,
            saldoInicial: cuenta.saldoInicial,
          }))
      : formData.cuentas.map((cuenta: any) => ({
          tipo: cuenta.tipo,
          moneda: cuenta.moneda,
          saldoInicial: cuenta.saldoInicial,
        }));

    const customerData: any = {
      direccion: formData.direccion,
      fechaNacimiento: this.formatDateForApi(formData.fechaNacimiento),
      usuarioId: formData.usuarioId,
      gestorId: formData.gestorId,
    };

    // Solo incluir cuentas si hay alguna para enviar
    if (cuentasToSend.length > 0) {
      customerData.cuentas = cuentasToSend;
    }

    if (this.isEditMode()) {
      this.customerService
        .updateCustomer(this.customerId()!, customerData)
        .pipe(
          tap((response) => {
            if (response.success) {
              this.toastService.success('Cliente actualizado exitosamente');
              this.goToCustomerDetail();
            }
          }),
          catchError((error) => {
            this.toastService.error('Error al actualizar cliente');
            return EMPTY;
          }),
          finalize(() => this.isLoading.set(false))
        )
        .subscribe();
    } else {
      this.customerService
        .createCustomer(customerData)
        .pipe(
          tap((response) => {
            if (response.success) {
              this.toastService.success('Cliente creado exitosamente');
              this.goToCustomerList();
            }
          }),
          catchError((error) => {
            this.toastService.error('Error al crear cliente');
            return EMPTY;
          }),
          finalize(() => this.isLoading.set(false))
        )
        .subscribe();
    }
  }

  hasError(controlName: string, errorType: string): boolean {
    const control = this.customerForm.get(controlName);
    return control ? control.hasError(errorType) && control.touched : false;
  }

  hasAccountError(
    index: number,
    controlName: string,
    errorType: string
  ): boolean {
    const control = this.cuentas.at(index)?.get(controlName);
    return control ? control.hasError(errorType) && control.touched : false;
  }

  getErrorMessage(controlName: string): string {
    const control = this.customerForm.get(controlName);
    if (!control) return '';

    if (control.hasError('required')) {
      return 'Este campo es obligatorio';
    }
    if (control.hasError('minlength')) {
      return `Debe tener al menos ${
        control.getError('minlength').requiredLength
      } caracteres`;
    }
    if (control.hasError('email')) {
      return 'Ingrese un correo electrónico válido';
    }
    if (control.hasError('pattern')) {
      return 'Ingrese un número de teléfono válido';
    }
    return '';
  }

  getAccountErrorMessage(index: number, controlName: string): string {
    const control = this.cuentas.at(index)?.get(controlName);
    if (!control) return '';

    if (control.hasError('required')) {
      return 'Este campo es obligatorio';
    }
    if (control.hasError('minlength')) {
      return `Debe tener al menos ${
        control.getError('minlength').requiredLength
      } caracteres`;
    }
    if (control.hasError('min')) {
      return 'El saldo debe ser mayor o igual a 0';
    }
    return '';
  }

  markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
      if (control instanceof FormArray) {
        control.controls.forEach((c) => {
          if (c instanceof FormGroup) {
            this.markFormGroupTouched(c);
          }
        });
      }
    });
  }

  title = computed(() =>
    this.isEditMode() ? 'Editar Cliente' : 'Crear Cliente'
  );
  submitButtonText = computed(() =>
    this.isEditMode() ? 'Actualizar Cliente' : 'Crear Cliente'
  );
  submitLoadingText = computed(() =>
    this.isEditMode() ? 'Actualizando...' : 'Creando...'
  );

  goBack(): void {
    this.location.back();
  }

  goToCustomerDetail(): void {
    if (this.customerId()) {
      this.router.navigate([`/admin/customers/detail/${this.customerId()}`]);
    }
  }

  goToCustomerList(): void {
    this.router.navigate(['/admin/customers']);
  }
}
