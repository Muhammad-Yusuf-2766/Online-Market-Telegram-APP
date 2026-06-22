import { sign } from "jsonwebtoken";

export async function signUserJwt(_app: unknown, userId: string): Promise<string> {
  const secret = process.env.JWT_SECRET ?? "test-jwt-secret";
  return sign({ sub: userId, typ: "user" }, secret, { expiresIn: "7d" });
}

export async function signAdminJwt(_app: unknown, adminUserId: string): Promise<string> {
  const secret = process.env.ADMIN_JWT_SECRET ?? "test-admin-jwt-secret";
  return sign({ sub: adminUserId, typ: "admin" }, secret, { expiresIn: "1d" });
}

export function authHeader(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}
