import { ApiProperty } from "@nestjs/swagger";

export class ShareResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  token: string;

  @ApiProperty()
  url: string;

  @ApiProperty({ required: false, nullable: true })
  expiresAt: Date | null;

  @ApiProperty({ required: false, default: false })
  public?: boolean;

  @ApiProperty({ required: false })
  shareId?: string;
}

export class SharePayloadDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  token: string;

  @ApiProperty()
  sessionId: string;

  @ApiProperty()
  isPublic: boolean;

  @ApiProperty({ required: false, nullable: true })
  expiresAt: Date | null;

  @ApiProperty()
  views: number;

  @ApiProperty()
  payload: unknown;

  @ApiProperty()
  createdAt: Date;
}
