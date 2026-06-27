import NextAuth, { DefaultSession } from "next-auth";
import { IPermission } from "@/models/Role";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      organizationId: string;
      permissions: IPermission[];
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: string;
    organizationId: string;
    permissions: IPermission[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    organizationId: string;
    permissions: IPermission[];
  }
}
