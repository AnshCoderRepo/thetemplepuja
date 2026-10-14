export interface AdminConfigResponse {
  email: string;
  isDefault: boolean;
}

export interface AdminLoginResponse {
  ok: boolean;
  token?: string;
  error?: string;
}

export interface DevoteeLoginResponse {
  ok: boolean;
  error?: string;
  requireActivation?: boolean;
  phone?: string;
  token?: string;
  user?: any;
}

export interface OtpChallengeResponse {
  ok: boolean;
  message?: string;
  error?: string;
  resendAfterSec?: number;
  expiresInSec?: number;
  testCode?: string;
  testCodeNotice?: string;
  alreadyActive?: boolean;
}


export interface ChangeAdminCredentialsInput {
  currentPassword: string;
  email: string;
  newPassword: string;
  token: string;
}
