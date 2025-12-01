import { Routes } from '@angular/router';

// Dashboard
import { CustomerDashboardComponent } from '../customer-dashboard/customer-dashboard.component';

// Accounts
import { MyAccountsComponent } from '../accounts/my-accounts/my-accounts.component';
import { CreateAccountComponent } from '../accounts/create-account/create-account.component';
import { AccountDetailComponent } from '../accounts/account-detail/account-detail.component';

// Transfers
import { NewTransferComponent } from '../transfers/new-transfer/new-transfer.component';
import { TransferHistoryComponent } from '../transfers/transfer-history/transfer-history.component';

// Beneficiaries
import { BeneficiaryListComponent } from '../beneficiaries/beneficiary-list/beneficiary-list.component';
import { CreateBeneficiaryComponent } from '../beneficiaries/create-beneficiary/create-beneficiary.component';

// Payments
import { MakePaymentComponent } from '../payments/make-payment/make-payment.component';
import { PaymentHistoryComponent } from '../payments/payment-history/payment-history.component';

// Reports
import { AccountStatementComponent } from '../reports/account-statement/account-statement.component';
import { CustomerSummaryComponent } from '../reports/customer-summary/customer-summary.component';
import { DetailTransferComponent } from '../transfers/detail-transfer/detail-transfer.component';

export const TABS_ROUTES: Routes = [
  {
    path: 'dashboard',
    component: CustomerDashboardComponent
  },

  // Tab: Cuentas
  {
    path: 'cuentas',
    children: [
      {
        path: '',
        component: MyAccountsComponent
      },
      {
        path: 'crear',
        component: CreateAccountComponent
      },
      {
        path: ':id',
        component: AccountDetailComponent
      }
    ]
  },

  // Tab: Transferencias (incluye beneficiarios)
  {
    path: 'transferencias',
    children: [
      {
        path: '',
        component: TransferHistoryComponent
      },
      {
        path: 'nueva',
        component: NewTransferComponent
      },
      {
        path: 'beneficiarios',
        component: BeneficiaryListComponent
      },
      {
        path: 'beneficiarios/crear',
        component: CreateBeneficiaryComponent
      }, {
        path: ':id',
        component: DetailTransferComponent
      }
    ]
  },

  // Tab: Pagos
  {
    path: 'pagos',
    children: [
      {
        path: '',
        component: PaymentHistoryComponent
      },
      {
        path: 'realizar',
        component: MakePaymentComponent
      }
    ]
  },

  // Tab: Reportes
  {
    path: 'reportes',
    children: [
      {
        path: '',
        component: CustomerSummaryComponent
      },
      {
        path: 'extracto',
        component: AccountStatementComponent
      },
      {
        path: 'extracto/:cuentaId',
        component: AccountStatementComponent
      }
    ]
  },

  // Redirección por defecto
  {
    path: '',
    redirectTo: 'inicio',
    pathMatch: 'full'
  }
];
