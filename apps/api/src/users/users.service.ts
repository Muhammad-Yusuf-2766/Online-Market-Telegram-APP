import { Injectable } from "@nestjs/common";
import type { User } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateProfileDto } from "./dto/update-profile.dto";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string): Promise<User> {
    return this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
  }

  async updateMe(userId: string, dto: UpdateProfileDto): Promise<User> {
    const birthDate =
      dto.birthDate !== undefined ? new Date(`${dto.birthDate}T00:00:00.000Z`) : undefined;

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        phone: dto.phone,
        firstName: dto.firstName,
        lastName: dto.lastName,
        ...(birthDate !== undefined ? { birthDate } : {}),
        ...(dto.locale !== undefined ? { locale: dto.locale } : {}),
        ...(dto.gender !== undefined ? { gender: dto.gender } : {}),
      },
    });
  }
}
