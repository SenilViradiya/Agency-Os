import { IRole, IPermission } from '@/models/Role';

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: string;
  organizationId: string;
  permissions: IPermission[];
}

export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  statusCode?: number;
}
