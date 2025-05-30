import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    const publicRoutes = ['/landing', '/', '/impressum', '/datenschutz'];
    
    if (publicRoutes.some(route => state.url.startsWith(route))) {
      return true; 
    }
    
    if (this.authService.isAuthenticated()) {
      return true;
    }
    
    this.router.navigate(['/landing']);
    return false;
  }
}