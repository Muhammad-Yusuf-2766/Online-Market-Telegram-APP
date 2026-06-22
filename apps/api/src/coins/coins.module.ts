import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { CoinsService } from "./coins.service";

@Module({
  imports: [PrismaModule],
  providers: [CoinsService],
  exports: [CoinsService],
})
export class CoinsModule {}
