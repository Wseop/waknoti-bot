import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { IntentsBitField } from 'discord.js';
import { NecordModule } from 'necord';
import { TwitchModule } from './twitch/twitch.module';
import { WakzooModule } from './wakzoo/wakzoo.module';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    NecordModule.forRoot({
      token: process.env.BOT_TOKEN,
      intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.MessageContent,
      ],
      development: [process.env.GUILD_ID],
    }),
    TwitchModule,
    WakzooModule,
  ],
  providers: [AppService],
})
export class AppModule {}
