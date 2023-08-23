import { ApiProperty } from '@nestjs/swagger';

export class StatusDto {
  @ApiProperty({ type: String })
  broadcasterLogin: string;

  @ApiProperty({ type: Boolean })
  isLive: boolean;

  @ApiProperty({ type: String })
  title: string;

  @ApiProperty({ type: String })
  gameName: string;

  @ApiProperty({ type: String })
  startedAt: string;
}
