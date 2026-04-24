import { Routes, RouterModule } from '@angular/router';

//Route for content layout with sidebar, navbar and footer.

export const Full_ROUTES: Routes = [
  {
    path: 'page',
    loadChildren: () => import('../../page/page.module').then(m => m.PageModule)
  },
  {
    path: 'onboarding/company',
    loadComponent: () => import('../../pages/onboarding/company-onboarding/company-onboarding.component').then(m => m.CompanyOnboardingComponent)
  },
  {
    path: 'users',
    loadComponent: () => import('../../pages/users/users-list/users-list.component').then(m => m.UsersListComponent)
  },
  {
    path: 'users/create',
    loadComponent: () => import('../../pages/users/users-create/users-create.component').then(m => m.UsersCreateComponent)
  },
  {
    path: 'users/:id/edit',
    loadComponent: () => import('../../pages/users/users-create/users-create.component').then(m => m.UsersCreateComponent)
  },
  {
    path: 'companies',
    loadComponent: () => import('../../pages/companies/companies-list/companies-list.component').then(m => m.CompaniesListComponent)
  },
  {
    path: 'companies/create',
    loadComponent: () => import('../../pages/companies/companies-create/companies-create.component').then(m => m.CompaniesCreateComponent)
  },
  {
    path: 'companies/:id/edit',
    loadComponent: () => import('../../pages/companies/companies-create/companies-create.component').then(m => m.CompaniesCreateComponent)
  },
  {
    path: 'companies/:id',
    loadComponent: () => import('../../pages/companies/company-detail/company-detail.component').then(m => m.CompanyDetailComponent)
  },
  {
    path: 'projects',
    loadComponent: () => import('../../pages/projects/projects-list/projects-list.component').then(m => m.ProjectsListComponent)
  },
  {
    path: 'projects/create',
    loadComponent: () => import('../../pages/projects/projects-create/projects-create.component').then(m => m.ProjectsCreateComponent)
  },
  {
    path: 'projects/:id/edit',
    loadComponent: () => import('../../pages/projects/projects-create/projects-create.component').then(m => m.ProjectsCreateComponent)
  },
  {
    path: 'projects/:id/task-review',
    loadComponent: () => import('../../pages/projects/projects-task-review/projects-task-review.component').then(m => m.ProjectsTaskReviewComponent)
  },
  {
    path: 'projects/:id/board',
    loadComponent: () => import('../../pages/projects/project-board/project-board.component').then(m => m.ProjectBoardComponent)
  },
  {
    path: 'projects/:id',
    loadComponent: () => import('../../pages/projects/project-detail/project-detail.component').then(m => m.ProjectDetailComponent)
  },
  {
    path: 'profile',
    loadComponent: () => import('../../pages/profile/my-profile.component').then(m => m.MyProfileComponent)
  }
];
