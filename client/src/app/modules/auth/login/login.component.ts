import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

// Custom strong password validator
function strongPasswordValidator(control: AbstractControl): ValidationErrors | null {
  const val = control.value || '';
  const errors: string[] = [];

  if (val.length < 8)          errors.push('min8');
  if (!/[A-Z]/.test(val))      errors.push('uppercase');
  if (!/[a-z]/.test(val))      errors.push('lowercase');
  if (!/[0-9]/.test(val))      errors.push('number');
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(val)) errors.push('special');

  return errors.length > 0 ? { passwordStrength: errors } : null;
}

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  form!: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  isRegisterMode = false;
  showPassword = false;

  roles = ['admin', 'engineer', 'viewer'];

  // Password strength
  strengthScore = 0;
  strengthLabel = '';
  strengthColor = '';
  strengthChecks = {
    min8:      false,
    uppercase: false,
    lowercase: false,
    number:    false,
    special:   false,
  };

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.authService.isLoggedIn) {
      this.router.navigate(['/dashboard']);
      return;
    }
    this.buildForm();
  }

  buildForm(): void {
    this.form = this.fb.group({
      name:     [''],
      email:    ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, strongPasswordValidator]],
      role:     ['engineer'],
    });

    // Watch password for strength indicator
    this.form.get('password')?.valueChanges.subscribe(val => {
      this.updateStrength(val || '');
    });
  }

  updateStrength(val: string): void {
    this.strengthChecks = {
      min8:      val.length >= 8,
      uppercase: /[A-Z]/.test(val),
      lowercase: /[a-z]/.test(val),
      number:    /[0-9]/.test(val),
      special:   /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(val),
    };

    const passed = Object.values(this.strengthChecks).filter(Boolean).length;
    this.strengthScore = passed;

    const map: Record<number, { label: string; color: string }> = {
      0: { label: '',        color: '' },
      1: { label: 'Very Weak',  color: '#FF4757' },
      2: { label: 'Weak',       color: '#FF6B35' },
      3: { label: 'Fair',       color: '#FFB830' },
      4: { label: 'Strong',     color: '#00D4FF' },
      5: { label: 'Very Strong', color: '#00E5A0' },
    };

    this.strengthLabel = map[passed].label;
    this.strengthColor = map[passed].color;
  }

  toggleMode(): void {
    this.isRegisterMode = !this.isRegisterMode;
    this.errorMessage = '';
    this.successMessage = '';
    this.strengthScore = 0;
    this.strengthLabel = '';

    const nameCtrl = this.form.get('name');
    if (this.isRegisterMode) {
      nameCtrl?.setValidators([Validators.required, Validators.minLength(2)]);
    } else {
      nameCtrl?.clearValidators();
    }
    nameCtrl?.updateValueAndValidity();
    this.form.reset({ role: 'engineer' });
  }

  submit(): void {
    this.form.markAllAsTouched();
    this.errorMessage = '';
    this.successMessage = '';

    if (this.form.invalid) return;

    this.isLoading = true;
    const { name, email, password, role } = this.form.value;

    if (this.isRegisterMode) {
      this.authService.register(name, email, password, role).subscribe({
        next: () => {
          this.isLoading = false;
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.isLoading = false;
          const status = err?.status;
          const msg = err?.error?.message || '';
          if (status === 409 || msg.toLowerCase().includes('already')) {
            this.errorMessage = 'An account with this email already exists. Please sign in instead.';
          } else if (status === 400) {
            this.errorMessage = 'Please check your details and try again.';
          } else if (status === 0 || status === 503) {
            this.errorMessage = 'Cannot reach server. Please check your connection.';
          } else {
            this.errorMessage = msg || 'Registration failed. Please try again.';
          }
        },
      });
    } else {
      this.authService.login(email, password).subscribe({
        next: () => {
          this.isLoading = false;
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.isLoading = false;
          const status = err?.status;
          const msg = err?.error?.message || '';
          if (status === 401) {
            this.errorMessage = 'Incorrect email or password. Please try again.';
          } else if (status === 403) {
            this.errorMessage = 'Your account has been deactivated. Contact your admin.';
          } else if (status === 404) {
            this.errorMessage = 'No account found with this email. Please register first.';
          } else if (status === 0 || status === 503) {
            this.errorMessage = 'Cannot reach server. Please check your connection.';
          } else {
            this.errorMessage = msg || 'Sign in failed. Please try again.';
          }
        },
      });
    }
  }

  get nameError(): string {
    const ctrl = this.form.get('name');
    if (ctrl?.touched && ctrl?.errors && this.isRegisterMode) {
      if (ctrl.errors['required'])  return 'Full name is required';
      if (ctrl.errors['minlength']) return 'Name must be at least 2 characters';
    }
    return '';
  }

  get emailError(): string {
    const ctrl = this.form.get('email');
    if (ctrl?.touched && ctrl?.errors) {
      if (ctrl.errors['required']) return 'Email address is required';
      if (ctrl.errors['email'])    return 'Please enter a valid email address';
    }
    return '';
  }

  get passwordError(): string {
    const ctrl = this.form.get('password');
    if (ctrl?.touched && ctrl?.errors) {
      if (ctrl.errors['required']) return 'Password is required';
      if (ctrl.errors['passwordStrength']) {
        const missing = ctrl.errors['passwordStrength'] as string[];
        if (missing.includes('min8'))      return 'Password must be at least 8 characters';
        if (missing.includes('uppercase')) return 'Add at least one uppercase letter (A-Z)';
        if (missing.includes('lowercase')) return 'Add at least one lowercase letter (a-z)';
        if (missing.includes('number'))    return 'Add at least one number (0-9)';
        if (missing.includes('special'))   return 'Add at least one special character (!@#$%...)';
      }
    }
    return '';
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  }
}