import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import type { CreatePermissionDto } from "./dto/create-permission.dto";
import type { UpdatePermissionDto } from "./dto/update-permission.dto";

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.permission.findMany({
      orderBy: [{ isSystem: "desc" }, { key: "asc" }],
    });
  }

  async create(dto: CreatePermissionDto) {
    const key = dto.key.toLowerCase();
    const existing = await this.prisma.permission.findUnique({ where: { key } });
    if (existing) {
      throw new ConflictException("Permission key already exists");
    }

    return this.prisma.permission.create({
      data: {
        key,
        name: dto.name,
        description: dto.description ?? null,
        isSystem: false,
      },
    });
  }

  async update(id: string, dto: UpdatePermissionDto) {
    const permission = await this.prisma.permission.findUnique({ where: { id } });
    if (!permission) {
      throw new NotFoundException("Permission not found");
    }

    if (dto.key !== undefined && permission.isSystem) {
      throw new BadRequestException("Cannot change key of a system permission");
    }

    if (dto.key && dto.key !== permission.key) {
      const taken = await this.prisma.permission.findUnique({
        where: { key: dto.key.toLowerCase() },
      });
      if (taken) {
        throw new ConflictException("Permission key already exists");
      }
    }

    const data: Prisma.PermissionUpdateInput = {};
    if (dto.key !== undefined) data.key = dto.key.toLowerCase();
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;

    return this.prisma.permission.update({ where: { id }, data });
  }

  async remove(id: string) {
    const permission = await this.prisma.permission.findUnique({ where: { id } });
    if (!permission) {
      throw new NotFoundException("Permission not found");
    }
    if (permission.isSystem) {
      throw new BadRequestException("Cannot delete a system permission");
    }

    await this.prisma.permission.delete({ where: { id } });
    return { ok: true };
  }
}
