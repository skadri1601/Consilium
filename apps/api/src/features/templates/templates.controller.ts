import { Controller, Get, NotFoundException, Param } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { DEBATE_TEMPLATES } from "./templates.data";

@ApiTags("templates")
@Controller("templates")
export class TemplatesController {
  @Get()
  @ApiOperation({ summary: "List all debate templates" })
  @ApiResponse({ status: 200, description: "All debate templates" })
  findAll() {
    return DEBATE_TEMPLATES;
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a single debate template by ID" })
  @ApiResponse({ status: 200, description: "Debate template" })
  @ApiResponse({ status: 404, description: "Template not found" })
  findOne(@Param("id") id: string) {
    const template = DEBATE_TEMPLATES.find((t) => t.id === id);
    if (!template) {
      throw new NotFoundException(`Template '${id}' not found`);
    }
    return template;
  }
}
