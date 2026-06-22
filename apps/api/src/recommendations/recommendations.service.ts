import { Injectable } from "@nestjs/common";
import { ProductsService } from "../products/products.service";
import { UsersService } from "../users/users.service";

@Injectable()
export class RecommendationsService {
  constructor(
    private readonly products: ProductsService,
    private readonly users: UsersService,
  ) {}

  similar(productId: string) {
    return this.products.similar(productId);
  }

  frequentlyBoughtTogether(productId: string) {
    return this.products.frequentlyBoughtTogether(productId);
  }

  recentlyViewed(userId: string) {
    return this.users.getRecentlyViewed(userId);
  }
}

