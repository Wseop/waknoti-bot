import { Module } from '@nestjs/common';
import { TwitchModule } from 'src/twitch/twitch.module';
import { AlarmService } from './alarm.service';
import { WakzooModule } from 'src/wakzoo/wakzoo.module';

@Module({
  imports: [TwitchModule, WakzooModule],
  providers: [AlarmService],
  exports: [AlarmService],
})
export class AlarmModule {}
