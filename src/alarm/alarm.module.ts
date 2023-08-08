import { Module } from '@nestjs/common';
import { TwitchModule } from 'src/twitch/twitch.module';
import { AlarmService } from './alarm.service';

@Module({
  imports: [TwitchModule],
  providers: [AlarmService],
  exports: [AlarmService],
})
export class AlarmModule {}
