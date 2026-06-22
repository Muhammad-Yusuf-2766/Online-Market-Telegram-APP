import {
  BadGatewayException,
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import { CreateUserAddressDto } from "./dto/create-user-address.dto";
import { UpdateUserAddressDto } from "./dto/update-user-address.dto";

type KakaoDocument = {
  address_name?: string;
  x?: string;
  y?: string;
  address?: {
    address_name?: string;
    zip_code?: string;
  } | null;
  road_address?: {
    address_name?: string;
    building_name?: string;
    zone_no?: string;
  } | null;
};

type KakaoResponse = {
  documents?: KakaoDocument[];
};

export type NormalizedAddressSearchResult = {
  addressName: string;
  roadAddressName: string | null;
  jibunAddressName: string | null;
  buildingName: string | null;
  zoneNo: string | null;
  latitude: number | null;
  longitude: number | null;
  raw?: KakaoDocument;
};

@Injectable()
export class AddressesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async search(query: string): Promise<NormalizedAddressSearchResult[]> {
    const q = query.trim();
    if (q.length < 2) {
      throw new BadRequestException("Address query must be at least 2 characters");
    }
    if (q.length > 120) {
      throw new BadRequestException("Address query is too long");
    }

    const apiKey = this.config.get<string>("KAKAO_REST_API_KEY");
    if (!apiKey) {
      throw new BadGatewayException("Kakao address search is not configured");
    }

    const url = new URL("https://dapi.kakao.com/v2/local/search/address.json");
    url.searchParams.set("query", q);
    url.searchParams.set("size", "10");

    let response: Response;
    try {
      response = await fetch(url, {
        headers: { Authorization: `KakaoAK ${apiKey}` },
      });
    } catch {
      throw new BadGatewayException("Kakao address search failed");
    }

    if (!response.ok) {
      throw new BadGatewayException("Kakao address search failed");
    }

    const data = (await response.json()) as KakaoResponse;
    const docs = Array.isArray(data.documents) ? data.documents : [];
    return docs.map((doc) => ({
      addressName: doc.address_name ?? doc.road_address?.address_name ?? doc.address?.address_name ?? "",
      roadAddressName: doc.road_address?.address_name ?? null,
      jibunAddressName: doc.address?.address_name ?? null,
      buildingName: doc.road_address?.building_name || null,
      zoneNo: doc.road_address?.zone_no ?? doc.address?.zip_code ?? null,
      latitude: this.parseCoordinate(doc.y),
      longitude: this.parseCoordinate(doc.x),
      raw: doc,
    }));
  }

  listForUser(userId: string) {
    return this.prisma.userAddress.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
  }

  async createForUser(userId: string, dto: CreateUserAddressDto) {
    const count = await this.prisma.userAddress.count({ where: { userId } });
    if (count >= 3) {
      throw new BadRequestException("Users can save at most 3 addresses");
    }
    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefault || count === 0) {
        await tx.userAddress.updateMany({
          where: { userId },
          data: { isDefault: false },
        });
      }
      return tx.userAddress.create({
        data: {
          userId,
          label: dto.label ?? null,
          recipientName: dto.recipientName ?? null,
          phone: dto.phone ?? null,
          addressName: dto.addressName,
          roadAddressName: dto.roadAddressName ?? null,
          jibunAddressName: dto.jibunAddressName ?? null,
          buildingName: dto.buildingName ?? null,
          zoneNo: dto.zoneNo ?? null,
          detailAddress: dto.detailAddress,
          latitude: dto.latitude ?? null,
          longitude: dto.longitude ?? null,
          isDefault: dto.isDefault ?? count === 0,
        },
      });
    });
  }

  async updateForUser(userId: string, id: string, dto: UpdateUserAddressDto) {
    await this.assertOwner(userId, id);
    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefault) {
        await tx.userAddress.updateMany({
          where: { userId, id: { not: id } },
          data: { isDefault: false },
        });
      }
      return tx.userAddress.update({
        where: { id },
        data: {
          ...this.addressData(dto),
          ...(dto.isDefault !== undefined ? { isDefault: dto.isDefault } : {}),
        },
      });
    });
  }

  async deleteForUser(userId: string, id: string) {
    await this.assertOwner(userId, id);
    await this.prisma.userAddress.delete({ where: { id } });
    return { ok: true as const };
  }

  private async assertOwner(userId: string, id: string) {
    const row = await this.prisma.userAddress.findUnique({ where: { id } });
    if (!row) {
      throw new NotFoundException("Address not found");
    }
    if (row.userId !== userId) {
      throw new ForbiddenException();
    }
  }

  private addressData(dto: Partial<CreateUserAddressDto>) {
    return {
      ...(dto.label !== undefined ? { label: dto.label ?? null } : {}),
      ...(dto.recipientName !== undefined ? { recipientName: dto.recipientName ?? null } : {}),
      ...(dto.phone !== undefined ? { phone: dto.phone ?? null } : {}),
      ...(dto.addressName !== undefined ? { addressName: dto.addressName } : {}),
      ...(dto.roadAddressName !== undefined ? { roadAddressName: dto.roadAddressName ?? null } : {}),
      ...(dto.jibunAddressName !== undefined ? { jibunAddressName: dto.jibunAddressName ?? null } : {}),
      ...(dto.buildingName !== undefined ? { buildingName: dto.buildingName ?? null } : {}),
      ...(dto.zoneNo !== undefined ? { zoneNo: dto.zoneNo ?? null } : {}),
      ...(dto.detailAddress !== undefined ? { detailAddress: dto.detailAddress } : {}),
      ...(dto.latitude !== undefined ? { latitude: dto.latitude ?? null } : {}),
      ...(dto.longitude !== undefined ? { longitude: dto.longitude ?? null } : {}),
    };
  }

  private parseCoordinate(raw: string | undefined): number | null {
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }
}
