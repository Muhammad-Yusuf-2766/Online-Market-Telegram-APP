import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readAppVersion(): string {
  const pkgPath = join(__dirname, "..", "..", "package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as { version: string };
  return pkg.version;
}

@ApiTags("version")
@Controller()
export class VersionController {
  @Get("version")
  @ApiOperation({ summary: "Application version and build metadata" })
  @ApiOkResponse({ description: "Version, git commit, and build timestamp" })
  getVersion() {
    return {
      version: readAppVersion(),
      commit: process.env.GIT_SHA ?? null,
      builtAt: process.env.BUILD_TIME ?? null,
    };
  }
}
