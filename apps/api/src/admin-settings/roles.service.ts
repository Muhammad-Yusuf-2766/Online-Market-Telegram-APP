import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import type { CreateRoleDto } from "./dto/create-role.dto";
import type { SetPermissionsDto } from "./dto/set-permissions.dto";
import type { UpdateRoleDto } from "./dto/update-role.dto";

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const roles = await this.prisma.role.findMany({
      orderBy: [{ isSystem: "desc" }, { name: "asc" }],
      include: {
        _count: { select: { adminUsers: true, permissions: true } },
      },
    });
    return roles.map((r) => ({
      id: r.id,
      key: r.key,
      name: r.name,
      description: r.description,
      isSystem: r.isSystem,
      isSuperAdmin: r.isSuperAdmin,
      memberCount: r._count.adminUsers,
      permissionCount: r._count.permissions,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
  }

  async findOne(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { adminUsers: true } },
      },
    });
    if (!role) {
      throw new NotFoundException("Role not found");
    }
    return {
      id: role.id,
      key: role.key,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      isSuperAdmin: role.isSuperAdmin,
      memberCount: role._count.adminUsers,
      permissions: role.permissions.map((rp) => rp.permission),
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
  }

  async create(dto: CreateRoleDto) {
    const key = dto.key.toLowerCase();
    const existing = await this.prisma.role.findUnique({ where: { key } });
    if (existing) {
      throw new ConflictException("Role key already exists");
    }

    const role = await this.prisma.role.create({
      data: {
        key,
        name: dto.name,
        description: dto.description ?? null,
        isSystem: false,
        isSuperAdmin: false,
      },
    });
    return this.findOne(role.id);
  }

  async update(id: string, dto: UpdateRoleDto) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) {
      throw new NotFoundException("Role not found");
    }

    if (dto.key !== undefined && role.isSystem) {
      throw new BadRequestException("Cannot change key of a system role");
    }

    if (dto.key && dto.key !== role.key) {
      const taken = await this.prisma.role.findUnique({
        where: { key: dto.key.toLowerCase() },
      });
      if (taken) {
        throw new ConflictException("Role key already exists");
      }
    }

    const data: Prisma.RoleUpdateInput = {};
    if (dto.key !== undefined) data.key = dto.key.toLowerCase();
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;

    await this.prisma.role.update({ where: { id }, data });
    return this.findOne(id);
  }

  async remove(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: { _count: { select: { adminUsers: true } } },
    });
    if (!role) {
      throw new NotFoundException("Role not found");
    }
    if (role.isSystem) {
      throw new BadRequestException("Cannot delete a system role");
    }
    if (role._count.adminUsers > 0) {
      throw new ConflictException({
        message: "Role is assigned to admin users",
        memberCount: role._count.adminUsers,
      });
    }

    await this.prisma.role.delete({ where: { id } });
    return { ok: true };
  }

  async setPermissions(id: string, dto: SetPermissionsDto) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) {
      throw new NotFoundException("Role not found");
    }
    if (role.isSuperAdmin) {
      throw new BadRequestException("Super admin role permissions are managed automatically");
    }

    const permissions = await this.prisma.permission.findMany({
      where: { id: { in: dto.permissionIds } },
    });
    if (permissions.length !== dto.permissionIds.length) {
      throw new BadRequestException("One or more permission IDs are invalid");
    }

    await this.prisma.$transaction([
      this.prisma.rolePermission.deleteMany({ where: { roleId: id } }),
      this.prisma.rolePermission.createMany({
        data: dto.permissionIds.map((permissionId) => ({
          roleId: id,
          permissionId,
        })),
      }),
    ]);

    return this.findOne(id);
  }
}
