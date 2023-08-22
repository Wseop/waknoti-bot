import { Module } from '@nestjs/common';
import { TwitchService } from './twitch.service';
import { TwitchController } from './twitch.controller';
import { BrowserModule } from 'src/browser/browser.module';

@Module({
  imports: [BrowserModule],
  controllers: [TwitchController],
  providers: [TwitchService],
  exports: [TwitchService],
})
export class TwitchModule {}
