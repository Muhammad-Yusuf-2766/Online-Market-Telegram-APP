import { BadRequestException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { PrismaService } from "../prisma/prisma.service";
import { createPrismaMock, PrismaMock } from "../../test/setup/prisma-mock";
import { CoinsService } from "./coins.service";

describe("CoinsService", () => {
  let service: CoinsService;
  let tx: PrismaMock;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [CoinsService, { provide: PrismaService, useValue: createPrismaMock() }],
    }).compile();
    service = moduleRef.get(CoinsService);
    tx = createPrismaMock();
  });

  it("debitCheckoutSpend skips zero amount", async () => {
    await service.debitCheckoutSpend(tx, "user-1", "order-1", 0);
    expect(tx.user.findUniqueOrThrow).not.toHaveBeenCalled();
  });

  it("debitCheckoutSpend throws on insufficient balance", async () => {
    tx.user.findUniqueOrThrow.mockResolvedValue({ coinBalance: 100 } as never);
    await expect(service.debitCheckoutSpend(tx, "user-1", "order-1", 500)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it("debitCheckoutSpend decrements balance and writes ledger", async () => {
    tx.user.findUniqueOrThrow.mockResolvedValue({ coinBalance: 1000 } as never);
    tx.user.update.mockResolvedValue({} as never);
    tx.coinLedgerEntry.create.mockResolvedValue({} as never);
    await service.debitCheckoutSpend(tx, "user-1", "order-1", 200);
    expect(tx.user.update).toHaveBeenCalled();
    expect(tx.coinLedgerEntry.create).toHaveBeenCalled();
  });

  it("refundOrderCoinsIfNeeded is idempotent", async () => {
    tx.order.findUnique.mockResolvedValue({ id: "o1", userId: "u1", coinsAppliedUzs: 100 } as never);
    tx.coinLedgerEntry.findFirst.mockResolvedValue({ id: "existing" } as never);
    await service.refundOrderCoinsIfNeeded(tx, "o1");
    expect(tx.user.update).not.toHaveBeenCalled();
  });

  it("tryReferralPayoutOnOrderQualifying returns null for non-qualifying status", async () => {
    const result = await service.tryReferralPayoutOnOrderQualifying(
      tx,
      { id: "o1", userId: "u1", status: "PENDING", createdAt: new Date() },
      "PENDING",
    );
    expect(result).toBeNull();
  });
});
