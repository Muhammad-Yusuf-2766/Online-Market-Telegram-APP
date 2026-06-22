import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAdminGuard } from "../admin-auth/guards/jwt-admin.guard";
import { CreateMeasurementUnitDto } from "./dto/create-measurement-unit.dto";
import { UpdateMeasurementUnitDto } from "./dto/update-measurement-unit.dto";
import { MeasurementUnitsService } from "./measurement-units.service";

@ApiTags("measurement-units")
@Controller()
export class MeasurementUnitsController {
  constructor(private readonly units: MeasurementUnitsService) {}

  @Get("measurement-units")
  @ApiOperation({ summary: "Public measurement units" })
  @ApiOkResponse()
  listPublic() {
    return this.units.list();
  }

  @Get("admin/measurement-units")
  @ApiBearerAuth("admin-jwt")
  @UseGuards(JwtAdminGuard)
  listAdmin() {
    return this.units.list();
  }

  @Post("admin/measurement-units")
  @ApiBearerAuth("admin-jwt")
  @UseGuards(JwtAdminGuard)
  create(@Body() body: CreateMeasurementUnitDto) {
    return this.units.create(body);
  }

  @Patch("admin/measurement-units/:id")
  @ApiBearerAuth("admin-jwt")
  @UseGuards(JwtAdminGuard)
  update(@Param("id") id: string, @Body() body: UpdateMeasurementUnitDto) {
    return this.units.update(id, body);
  }

  @Delete("admin/measurement-units/:id")
  @ApiBearerAuth("admin-jwt")
  @UseGuards(JwtAdminGuard)
  remove(@Param("id") id: string) {
    return this.units.remove(id);
  }
}
