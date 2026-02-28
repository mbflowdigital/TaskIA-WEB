import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [RouterModule],
  template: `
    <div class="content-wrapper">
      <div class="content-body">
        <div class="wip-page">
          <div class="wip-page__icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="38" height="38" viewBox="0 0 24 24"
              fill="none" stroke="#30A66F" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
          </div>
          <h2 class="wip-page__title">Página em desenvolvimento</h2>
          <p class="wip-page__subtitle">Estamos trabalhando nesta funcionalidade. Em breve estará disponível.</p>
          <a routerLink="/page" class="btn btn-primary mt-1">Voltar ao início</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .wip-page {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: calc(100vh - 140px);
      text-align: center;
      gap: 1rem;
    }
    .wip-page__icon {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: linear-gradient(135deg, #0F1E35, #122549);
      border: 2px solid rgba(48, 166, 111, .35);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: .5rem;
    }
    .wip-page__icon i {
      font-size: 2.2rem;
      color: #30A66F;
    }
    .wip-page__title {
      font-size: 1.6rem;
      font-weight: 700;
      color: #122549;
      margin: 0;
    }
    .wip-page__subtitle {
      font-size: .95rem;
      color: #6b7280;
      margin: 0;
      max-width: 360px;
    }
  `]
})
export class ProjectDetailComponent {}
