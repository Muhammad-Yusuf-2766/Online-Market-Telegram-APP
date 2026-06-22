import { Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import type { OrderStatus } from "@prisma/client";
import type { Server, Socket } from "socket.io";
import { PrismaService } from "../prisma/prisma.service";
import type { JwtUserPayload } from "../auth/strategies/jwt-user.strategy";

export type UserOrderSocketPayload = {
  orderId: string;
  status: OrderStatus;
  updatedAt: string;
  reason: "created" | "updated";
};

export type ProductStockSocketPayload = {
  productId: string;
  stockQuantity: number;
};

const corsEnv = process.env.CORS_ORIGINS?.split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const wsCorsOrigin: true | string[] = corsEnv?.length ? corsEnv : true;

@WebSocketGateway({
  namespace: "/user",
  cors: {
    origin: wsCorsOrigin,
    credentials: true,
  },
})
export class UserOrdersGateway implements OnGatewayConnection {
  private readonly logger = new Logger(UserOrdersGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  emitOrderEvent(userId: string, payload: UserOrderSocketPayload): void {
    this.server.to(`user:${userId}`).emit("order:update", payload);
  }

  /** Broadcast to all connected mini-app clients (for catalog / stock). */
  emitProductStock(payload: ProductStockSocketPayload): void {
    this.server.emit("product:stock", payload);
  }

  async handleConnection(client: Socket): Promise<void> {
    const rawToken = this.extractToken(client);
    if (!rawToken) {
      this.logger.warn("User socket rejected: missing token");
      client.disconnect(true);
      return;
    }

    let payload: JwtUserPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtUserPayload>(rawToken);
    } catch {
      this.logger.warn("User socket rejected: invalid token");
      client.disconnect(true);
      return;
    }

    if (payload.typ !== "user" || !payload.sub) {
      client.disconnect(true);
      return;
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      client.disconnect(true);
      return;
    }

    client.data.userId = user.id;
    await client.join(`user:${user.id}`);
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
