import { Module } from '@nestjs/common';
import { WakzooService } from './wakzoo.service';
import { BrowserModule } from 'src/browser/browser.module';

@Module({
  imports: [BrowserModule],
  providers: [WakzooService],
  exports: [WakzooService],
})
export class WakzooModule {}
