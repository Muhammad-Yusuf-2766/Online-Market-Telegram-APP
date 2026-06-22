import { Test } from "@nestjs/testing";
import { ProductsService } from "../products/products.service";
import { UsersService } from "../users/users.service";
import { RecommendationsService } from "./recommendations.service";

describe("RecommendationsService", () => {
  let service: RecommendationsService;
  let products: jest.Mocked<Pick<ProductsService, "similar" | "frequentlyBoughtTogether">>;
  let users: jest.Mocked<Pick<UsersService, "getRecentlyViewed">>;

  beforeEach(async () => {
    products = {
      similar: jest.fn().mockResolvedValue([]),
      frequentlyBoughtTogether: jest.fn().mockResolvedValue([]),
    };
    users = { getRecentlyViewed: jest.fn().mockResolvedValue([]) };
    const moduleRef = await Test.createTestingModule({
      providers: [
        RecommendationsService,
        { provide: ProductsService, useValue: products },
        { provide: UsersService, useValue: users },
      ],
    }).compile();
    service = moduleRef.get(RecommendationsService);
  });

  it("delegates similar products", async () => {
    await service.similar("prod-1");
    expect(products.similar).toHaveBeenCalledWith("prod-1");
  });

  it("delegates frequently bought together", async () => {
    await service.frequentlyBoughtTogether("prod-1");
    expect(products.frequentlyBoughtTogether).toHaveBeenCalledWith("prod-1");
  });

  it("delegates recently viewed", async () => {
    await service.recentlyViewed("user-1");
    expect(users.getRecentlyViewed).toHaveBeenCalledWith("user-1");
  });
});
