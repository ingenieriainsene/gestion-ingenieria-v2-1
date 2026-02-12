import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard = () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (auth.isLoggedIn() && auth.getRole() === 'ROLE_ADMIN') {
        return true;
    }
    // Redirect to home or unauthorized page if not admin
    router.navigate(['/']);
    return false;
};
