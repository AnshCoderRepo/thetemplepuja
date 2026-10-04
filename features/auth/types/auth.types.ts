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
}

export interface ChangeAdminCredentialsInput {
  currentPassword: string;
  email: string;
  newPassword: string;
  token: string;
}
