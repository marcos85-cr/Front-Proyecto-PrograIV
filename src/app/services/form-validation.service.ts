import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class FormValidationService {

  constructor() { }
  isInvalid(form: FormGroup, controlName: string): boolean | null {
    const control = form.get(controlName);
    return control && control.invalid && control.touched;
  }

  isFieldInvalid(form: FormGroup, field: string, error: string): boolean | null {
    try {
      const control = form.get(field);
      return control && control.invalid && control.touched && control.hasError(error);
    }catch (e) {
      console.error('Error in isFieldInvalid:', e);
      return null;
    }
  }

  validateFormAndShowError(form: FormGroup): boolean {
    if (form.invalid) {
      // Marca todos los controles como tocados
      Object.keys(form.controls).forEach((field) => {
        const control = form.get(field);
        if (control) {
          control.markAsTouched({ onlySelf: true });
        }
      });
      return false; // Retorna falso si el formulario es inválido
    }

    return true; // Retorna verdadero si el formulario es válido
  }
}
