import { ApiProperty } from "@nestjs/swagger";

export class DebateResponseDto {
  @ApiProperty({ example: "debate-123" })
  id: string;

  @ApiProperty({ example: "Create a REST API for a todo app" })
  topic: string;

  @ApiProperty({ example: "completed", enum: ["pending", "in_progress", "completed", "failed"] })
  status: string;

  @ApiProperty({ example: ["gpt-4o-mini", "claude-3-5-haiku-latest"], type: [String] })
  modelsUsed: string[];

  @ApiProperty({ example: 0.05 })
  totalCost: number;

  @ApiProperty({ example: "Golden prompt text...", nullable: true })
  goldenPrompt: string | null;

  @ApiProperty({ example: "2024-01-01T00:00:00Z" })
  createdAt: Date;
}

export class DebateDetailDto extends DebateResponseDto {
  rounds: DebateRoundDto[];
}

export class DebateRoundDto {
  id: string;
  roundNumber: number;
  status: string;
  messages: DebateMessageDto[];
  createdAt: Date;
}

export class DebateMessageDto {
  id: string;
  agentId: string;
  modelUsed: string;
  content: string;
  promptTokens: number;
  completionTokens: number;
  cost: number;
  latencyMs: number;
  createdAt: Date;
}

