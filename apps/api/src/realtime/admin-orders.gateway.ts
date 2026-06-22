import { Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import type { Server, Socket } from "socket.io";
import { PrismaService } from "../prisma/prisma.service";
import type { AdminNotificationKind } from "@prisma/client";
import type { JwtAdminPayload } from "../admin-auth/strategies/jwt-admin.strategy";
import type { OrdersChangedPayload } from "./order-events.types";

export type NotificationNewPayload = {
  id: string;
  kind: AdminNotificationKind;
  orderId: string;
  createdAt: string;
  read: false;
};

const corsEnv = process.env.CORS_ORIGINS?.split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const wsCorsOrigin: true | string[] = corsEnv?.length ? corsEnv : true;

@WebSocketGateway({
  namespace: "/admin",
  cors: {
    origin: wsCorsOrigin,
    credentials: true,
  },
})
export class AdminOrdersGateway implements OnGatewayConnection {
  private readonly logger = new Logger(AdminOrdersGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  notifyOrdersChanged(payload: OrdersChangedPayload): void {
    this.server.emit("orders:changed", payload);
  }

  emitNotificationNew(payload: Omit<NotificationNewPayload, "read">): void {
    const body: NotificationNewPayload = { ...payload, read: false };
    this.server.emit("notifications:new", body);
  }

  async handleConnection(client: Socket): Promise<void> {
    const rawToken = this.extractToken(client);
    if (!rawToken) {
      this.logger.warn("Socket rejected: missing token");
      client.disconnect(true);
      return;
    }

    let payload: JwtAdminPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtAdminPayload>(rawToken);
    } catch {
      this.logger.warn("Socket rejected: invalid token");
      client.disconnect(true);
      return;
    }

    if (payload.typ !== "admin" || !payload.sub) {
      client.disconnect(true);
      return;
    }

    const admin = await this.prisma.adminUser.findUnique({ where: { id: payload.sub } });
    if (!admin) {
      client.disconnect(true);
      return;
    }

    client.data.adminId = admin.id;
  }

  private extractToken(client: Socket): string | undefined {
    const auth = client.handshake.auth as { token?: unknown };
    if (typeof auth?.token === "string" && auth.token.length > 0) {
      return auth.token;
    }
    const header = client.handshake.headers.authorization;
    if (typeof header === "string" && header.startsWith("Bearer ")) {
      return header.slice("Bearer ".length).trim();
    }
    return undefined;
  }
}
