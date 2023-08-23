import { Controller, Get, Param } from '@nestjs/common';
import { TwitchService } from './twitch.service';
import { StatusDto } from './dtos/status.dto';
import { ChannelInfo } from './interfaces/channel-info.interface';
import { ApiOkResponse, ApiParam, ApiTags } from '@nestjs/swagger';

@Controller('twitch')
@ApiTags('[Twitch]')
export class TwitchController {
  constructor(private readonly twitchService: TwitchService) {}

  @Get('/status/:broadcaster')
  @ApiParam({ name: 'broadcaster', example: 'woowakgood', required: true })
  @ApiOkResponse({ type: StatusDto })
  async getStatus(
    @Param('broadcaster') broadcaster: string,
  ): Promise<StatusDto> {
    const channelInfo: ChannelInfo = await this.twitchService.searchChannel(
      broadcaster,
    );
    let status: StatusDto = null;

    if (channelInfo) {
      status = {
        broadcasterLogin: channelInfo.broadcaster_login,
        isLive: channelInfo.is_live,
        title: channelInfo.title,
        gameName: channelInfo.game_name,
        startedAt: channelInfo.started_at,
      };
    }

    return status;
  }
}
