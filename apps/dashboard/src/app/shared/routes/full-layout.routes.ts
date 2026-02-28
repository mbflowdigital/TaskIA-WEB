import { Routes, RouterModule } from '@angular/router';

//Route for content layout with sidebar, navbar and footer.

export const Full_ROUTES: Routes = [
  {
    path: 'page',
    loadChildren: () => import('../../page/page.module').then(m => m.PageModule)
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
  }
];
