import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { PrismaService } from "../prisma/prisma.service";
import { createPrismaMock, PrismaMock } from "../../test/setup/prisma-mock";
import { SegmentsService } from "./segments.service";

describe("SegmentsService", () => {
  let service: SegmentsService;
  let prisma: PrismaMock;

  beforeEach(async () => {
    prisma = createPrismaMock();
    prisma.$transaction.mockImplementation(async (fn: (tx: PrismaMock) => Promise<unknown>) =>
      fn(prisma),
    );
    const moduleRef = await Test.createTestingModule({
      providers: [SegmentsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(SegmentsService);
  });

  it("list orders segments by createdAt desc", async () => {
    prisma.userSegment.findMany.mockResolvedValue([]);
    await service.list();
    expect(prisma.userSegment.findMany).toHaveBeenCalledWith({ orderBy: { createdAt: "desc" } });
  });

  it("create trims name and stores definition", async () => {
    prisma.userSegment.create.mockResolvedValue({ id: "s1" } as never);
    await service.create({ name: "  VIP  ", definition: { rule: "all" } });
    expect(prisma.userSegment.create).toHaveBeenCalledWith({
      data: { name: "VIP", definition: { rule: "all" } },
    });
  });

  it("syncMembersFromDefinition throws NotFound when segment missing", async () => {
    prisma.userSegment.findUnique.mockResolvedValue(null);
    await expect(service.syncMembersFromDefinition("s-missing")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("syncMembersFromDefinition throws BadRequest for invalid definition", async () => {
    prisma.userSegment.findUnique.mockResolvedValue({
      id: "s1",
      definition: "not-json-object",
    } as never);
    await expect(service.syncMembersFromDefinition("s1")).rejects.toBeInstanceOf(BadRequestException);
  });

  it("syncMembersFromDefinition refreshes memberships in a transaction", async () => {
    prisma.userSegment.findUnique.mockResolvedValue({
      id: "s1",
      definition: { rule: "all" },
    } as never);
    prisma.user.findMany.mockResolvedValue([{ id: "u1" }, { id: "u2" }] as never);
    prisma.userSegmentMembership.deleteMany.mockResolvedValue({ count: 0 } as never);
    prisma.userSegmentMembership.createMany.mockResolvedValue({ count: 2 } as never);
    prisma.userSegment.update.mockResolvedValue({} as never);
    await expect(service.syncMembersFromDefinition("s1")).resolves.toEqual({ synced: 2 });
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.userSegmentMembership.createMany).toHaveBeenCalledWith({
      data: [
        { segmentId: "s1", userId: "u1" },
        { segmentId: "s1", userId: "u2" },
      ],
    });
  });

  it("addMembers returns 0 for empty user id list", async () => {
    prisma.userSegment.findUnique.mockResolvedValue({ id: "s1" } as never);
    await expect(service.addMembers("s1", [])).resolves.toEqual({ added: 0 });
    expect(prisma.userSegmentMembership.createMany).not.toHaveBeenCalled();
  });
});
