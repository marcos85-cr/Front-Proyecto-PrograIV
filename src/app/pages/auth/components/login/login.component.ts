import { USER_ROLES } from './../../../../shared/constants/user-roles.constants';
import { Component, signal, inject, ViewEncapsulation } from '@angular/core';
import {
  FormGroup,
  NonNullableFormBuilder,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { ToastService } from 'src/app/services/toast.service';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [IonicModule, ReactiveFormsModule],
  standalone: true,
  encapsulation: ViewEncapsulation.None,
})
export class LoginComponent {
  // Inject dependencies usando la función inject()
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  // Signals para estado reactivo
  readonly showPassword = signal(false);
  readonly isLoading = signal(false);

  // Formulario reactivo
  readonly loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  togglePassword(): void {
    this.showPassword.update(value => !value);
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading.set(true);

      this.authService.signIn(this.loginForm.getRawValue()).subscribe({
        next: async (res: any) => {
          this.authService.saveToken(res.data.token);
          this.authService.loginSuccess$.subscribe();

          await this.toastService.success('Inicio de sesión exitoso', 2000);
          const infoUser = this.authService.getUserInfo();
          if (infoUser.role === USER_ROLES.ADMINISTRADOR) {
            this.router.navigate(['/admin/dashboard']);
          } else if (infoUser.role === USER_ROLES.GESTOR) {
            this.router.navigate(['/manager/dashboard']);
          } else if (infoUser.role === USER_ROLES.CLIENTE) {
            this.router.navigate(['/customer/dashboard']);
          }
        },
        error:   (error) => {
          this.toastService.error(error.message || 'Error en inicio de sesión');
          this.isLoading.set(false);
        },
        complete: () => {
          this.isLoading.set(false);
        },
      });
    }
  }
}
