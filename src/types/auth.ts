// Types d'authentification

export interface LoginRequest {
    email: string;
    password: string;
  }
  
  export interface LoginResponse {
    token: string;
    role: string;
    user?: {
      id: number;
      nom: string;
      prenom: string;
      adresseMail: string;
      telephone?: string;
      numeroCni?: string;
      role?: string;
      agenceId?: number;
    };
  }
  
  export interface UserProfile {
    id: number;
    nom: string;
    prenom: string;
    adresseMail: string;
    telephone?: string;
    numeroCni?: string;
    role: string;
    agenceId?: number;
  }
  
  export interface ForgotPasswordRequest {
    email: string;
  }
  
  export interface SecurityCodeVerificationRequest {
    email: string;
    code: string;
  }
  
  export interface ResetPasswordRequest {
    email: string;
    password: string;
    code: string;
  }
  
  export interface ErrorResponse {
    code: number | string;
    message: string;
    details?: any;
  }