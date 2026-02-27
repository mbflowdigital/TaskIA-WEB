import { Component, ViewContainerRef, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html'
})
export class AppComponent implements OnInit, OnDestroy {

    subscription: Subscription;

    constructor(private router: Router, private translate: TranslateService) {
        const supportedLangs = ['pt-BR', 'en', 'es', 'de'];
        this.translate.addLangs(supportedLangs);
        this.translate.setDefaultLang('pt-BR');

        const browserCulture = this.translate.getBrowserCultureLang() ?? '';
        const browserLang = this.translate.getBrowserLang() ?? '';
        const resolvedLang =
            supportedLangs.includes(browserCulture) ? browserCulture :
            browserCulture.startsWith('pt') || browserLang.startsWith('pt') ? 'pt-BR' :
            supportedLangs.includes(browserLang) ? browserLang :
            'pt-BR';

        this.translate.use(resolvedLang);
    }

    ngOnInit() {
        this.subscription = this.router.events
            .pipe(
                filter(event => event instanceof NavigationEnd)
            )
            .subscribe(() => window.scrollTo(0, 0));
    }


    ngOnDestroy() {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }



}