import { Module } from '@nestjs/common';
import { WakzooService } from './wakzoo.service';

@Module({
  providers: [WakzooService],
  exports: [WakzooService],
})
export class WakzooModule {}
