import { Router } from '@angular/router';
import { Injectable } from '@angular/core';
// Firebase imports comentados - API mudou completamente no Angular Fire 17+
// import { AngularFireAuth } from "@angular/fire/auth";
// import firebase from 'firebase/app'
import { Observable } from 'rxjs';

@Injectable()
export class AuthService {
  // Firebase types comentados temporariamente
  // private user: Observable<firebase.User>;
  // private userDetails: firebase.User = null;
  private user: Observable<any>;
  private userDetails: any = null;

  constructor(public router: Router) {
    // Firebase auth comentado - requer migração para nova API
    // this.user = _firebaseAuth.authState;
    // this.user.subscribe(
    //   (user) => {
    //     if (user) {
    //       this.userDetails = user;
    //     }
    //     else {
    //       this.userDetails = null;
    //     }
    //   }
    // );

  }

  signupUser(email: string, password: string) {
    //your code for signing up the new user
  }

  signinUser(email: string, password: string) {
    //your code for checking credentials and getting tokens for for signing in user
    // return this._firebaseAuth.signInWithEmailAndPassword(email, password)

    //uncomment above firebase auth code and remove this temp code
    return new Promise(function(resolve, reject) {
      setTimeout(function() {
        resolve(true);
      }, 1000);
    });

  }

  logout() {
    // this._firebaseAuth.signOut(); // Firebase comentado
    this.router.navigate(['YOUR_LOGOUT_URL']);
  }

  isAuthenticated() {
    return true;
  }
}
