import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { AdminAuthService } from "../admin-auth/admin-auth.service";
import { PaginationQueryDto } from "../common/dto/pagination-query.dto";
import { paginationParams, toPaginatedResult } from "../common/pagination";
import { PrismaService } from "../prisma/prisma.service";
import type { CreateAdminUserDto } from "./dto/create-admin-user.dto";
import type { UpdateAdminUserDto } from "./dto/update-admin-user.dto";

@Injectable()
export class AdminUsersMgmtService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly adminAuth: AdminAuthService,
  ) {}

  async findAll(query: PaginationQueryDto, q?: string) {
    const { page, pageSize, skip } = paginationParams(query);
    const where: Prisma.AdminUserWhereInput = q
      ? {
          OR: [
            { email: { contains: q, mode: "insensitive" } },
            { fullName: { contains: q, mode: "insensitive" } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      this.prisma.adminUser.findMany({ where, skip, take: pageSize, orderBy: { createdAt: "desc" } }),
      this.prisma.adminUser.count({ where }),
    ]);
    return toPaginatedResult(items, total, page, pageSize);
  }

  async findOne(id: string) {
    const admin = await this.prisma.adminUser.findUnique({ where: { id } });
    if (!admin) throw new NotFoundException("Admin user not found");
    return admin;
  }

  async create(dto: CreateAdminUserDto) {
    const email = dto.email.toLowerCase();
    const existing = await this.prisma.adminUser.findUnique({ where: { email } });
    if (existing) throw new ConflictException("Email already in use");
    const passwordHash = await this.adminAuth.hashPassword(dto.password);
    return this.prisma.adminUser.create({
      data: {
        email,
        passwordHash,
        fullName: dto.fullName ?? null,
        isActive: dto.isActive ?? true,
        isSuperAdmin: true,
      },
    });
  }

  async update(id: string, dto: UpdateAdminUserDto) {
    const admin = await this.prisma.adminUser.findUnique({ where: { id } });
    if (!admin) throw new NotFoundException("Admin user not found");

    if (dto.email && dto.email.toLowerCase() !== admin.email) {
      const taken = await this.prisma.adminUser.findUnique({ where: { email: dto.email.toLowerCase() } });
      if (taken) throw new ConflictException("Email already in use");
    }

    return this.prisma.adminUser.update({
      where: { id },
      data: {
        ...(dto.email !== undefined ? { email: dto.email.toLowerCase() } : {}),
        ...(dto.fullName !== undefined ? { fullName: dto.fullName } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.password ? { passwordHash: await this.adminAuth.hashPassword(dto.password) } : {}),
        isSuperAdmin: true,
      },
    });
  }

  async remove(id: string, currentAdminId: string) {
    if (id === currentAdminId) throw new BadRequestException("Cannot delete your own account");
    const activeAdmins = await this.prisma.adminUser.count({ where: { isActive: true } });
    const target = await this.prisma.adminUser.findUnique({ where: { id } });
    if (!target) throw new NotFoundException("Admin user not found");
    if (target.isActive && activeAdmins <= 1) {
      throw new BadRequestException("Cannot delete the last active admin");
    }
    await this.prisma.adminUser.delete({ where: { id } });
    return { ok: true };
  }
}
