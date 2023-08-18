import { Module } from '@nestjs/common';
import { TwitchService } from './twitch.service';
import { TwitchController } from './twitch.controller';

@Module({
  controllers: [TwitchController],
  providers: [TwitchService],
  exports: [TwitchService],
})
export class TwitchModule {}
