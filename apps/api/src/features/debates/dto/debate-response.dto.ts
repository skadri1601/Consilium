import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class DebateResponseDto {
  @ApiProperty({ example: "debate-123" })
  id: string;

  @ApiProperty({ example: "Create a REST API for a todo app" })
  topic: string;

  @ApiProperty({
    example: "completed",
    enum: ["pending", "in_progress", "completed", "failed"],
  })
  status: string;

  @ApiProperty({
    example: ["gpt-5.4-mini", "claude-haiku-4-5-20251001"],
    type: [String],
  })
  modelsUsed: string[];

  @ApiProperty({ example: 0.05 })
  totalCost: number;

  @ApiProperty({ example: "Golden prompt text...", nullable: true })
  goldenPrompt: string | null;

  @ApiProperty({ example: "2024-01-01T00:00:00Z" })
  createdAt: Date;

  @ApiPropertyOptional({
    description:
      "BullMQ job id when DEBATE_USE_QUEUE is enabled; poll job status or open SSE after workers accept the debate",
    example: "debate-123",
  })
  queueJobId?: string;
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
