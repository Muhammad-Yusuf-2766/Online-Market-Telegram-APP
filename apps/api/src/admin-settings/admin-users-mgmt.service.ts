import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { AdminAuthService } from "../admin-auth/admin-auth.service";
import { adminUserWithPermissionsInclude } from "../common/rbac/admin-user-with-permissions";
import { PaginationQueryDto } from "../common/dto/pagination-query.dto";
import { paginationParams, toPaginatedResult } from "../common/pagination";
import { PrismaService } from "../prisma/prisma.service";
import type { CreateAdminUserDto } from "./dto/create-admin-user.dto";
import type { SetPermissionsDto } from "./dto/set-permissions.dto";
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
      this.prisma.adminUser.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          role: { select: { id: true, key: true, name: true, isSuperAdmin: true } },
          _count: { select: { directPermissions: true } },
        },
      }),
      this.prisma.adminUser.count({ where }),
    ]);

    return toPaginatedResult(
      items.map((u) => ({
        id: u.id,
        email: u.email,
        fullName: u.fullName,
        isActive: u.isActive,
        role: u.role,
        directPermissionCount: u._count.directPermissions,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      })),
      total,
      page,
      pageSize,
    );
  }

  async findOne(id: string) {
    const admin = await this.prisma.adminUser.findUnique({
      where: { id },
      include: {
        ...adminUserWithPermissionsInclude,
        role: {
          include: {
            permissions: { include: { permission: true } },
          },
        },
      },
    });
    if (!admin) {
      throw new NotFoundException("Admin user not found");
    }
    return {
      id: admin.id,
      email: admin.email,
      fullName: admin.fullName,
      isActive: admin.isActive,
      role: admin.role
        ? {
            id: admin.role.id,
            key: admin.role.key,
            name: admin.role.name,
            isSuperAdmin: admin.role.isSuperAdmin,
            permissions: admin.role.permissions.map((rp) => rp.permission),
          }
        : null,
      directPermissions: admin.directPermissions.map((up) => up.permission),
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
    };
  }

  async create(dto: CreateAdminUserDto) {
    const email = dto.email.toLowerCase();
    const existing = await this.prisma.adminUser.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException("Email already in use");
    }
    if (dto.roleId) {
      await this.assertRoleExists(dto.roleId);
    }

    const passwordHash = await this.adminAuth.hashPassword(dto.password);
    const admin = await this.prisma.adminUser.create({
      data: {
        email,
        passwordHash,
        fullName: dto.fullName ?? null,
        roleId: dto.roleId ?? null,
        isActive: dto.isActive ?? true,
      },
    });
    return this.findOne(admin.id);
  }

  async update(id: string, dto: UpdateAdminUserDto) {
    const admin = await this.prisma.adminUser.findUnique({ where: { id } });
    if (!admin) {
      throw new NotFoundException("Admin user not found");
    }

    if (dto.email && dto.email.toLowerCase() !== admin.email) {
      const taken = await this.prisma.adminUser.findUnique({
        where: { email: dto.email.toLowerCase() },
      });
      if (taken) {
        throw new ConflictException("Email already in use");
      }
    }

    if (dto.roleId) {
      await this.assertRoleExists(dto.roleId);
    }

    const data: Prisma.AdminUserUpdateInput = {};
    if (dto.email !== undefined) data.email = dto.email.toLowerCase();
    if (dto.fullName !== undefined) data.fullName = dto.fullName;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.roleId !== undefined) {
      data.role = dto.roleId ? { connect: { id: dto.roleId } } : { disconnect: true };
    }
    if (dto.password) {
      data.passwordHash = await this.adminAuth.hashPassword(dto.password);
    }

    await this.prisma.adminUser.update({ where: { id }, data });
    return this.findOne(id);
  }

  async remove(id: string, currentAdminId: string) {
    if (id === currentAdminId) {
      throw new BadRequestException("Cannot delete your own account");
    }

    const admin = await this.prisma.adminUser.findUnique({
      where: { id },
      include: { role: true },
    });
    if (!admin) {
      throw new NotFoundException("Admin user not found");
    }

    if (admin.role?.isSuperAdmin) {
      const superAdminCount = await this.prisma.adminUser.count({
        where: { role: { isSuperAdmin: true }, isActive: true },
      });
      if (superAdminCount <= 1) {
        throw new BadRequestException("Cannot delete the last active super admin");
      }
    }

    await this.prisma.adminUser.delete({ where: { id } });
    return { ok: true };
  }

  async setPermissions(id: string, dto: SetPermissionsDto) {
    const admin = await this.prisma.adminUser.findUnique({ where: { id } });
    if (!admin) {
      throw new NotFoundException("Admin user not found");
    }

    const permissions = await this.prisma.permission.findMany({
      where: { id: { in: dto.permissionIds } },
    });
    if (permissions.length !== dto.permissionIds.length) {
      throw new BadRequestException("One or more permission IDs are invalid");
    }

    await this.prisma.$transaction([
      this.prisma.adminUserPermission.deleteMany({ where: { adminUserId: id } }),
      this.prisma.adminUserPermission.createMany({
        data: dto.permissionIds.map((permissionId) => ({
          adminUserId: id,
          permissionId,
        })),
      }),
    ]);

    return this.findOne(id);
  }

  private async assertRoleExists(roleId: string) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      throw new BadRequestException("Role not found");
    }
  }
}
