import { PrismaClient } from "@prisma/client";
import { DeepMockProxy, mockDeep, mockReset } from "jest-mock-extended";

export type PrismaMock = DeepMockProxy<PrismaClient>;

export const createPrismaMock = (): PrismaMock => mockDeep<PrismaClient>();

export const resetPrismaMock = (mock: PrismaMock): void => {
  mockReset(mock);
};
