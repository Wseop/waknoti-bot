import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { EmbedBuilder } from 'discord.js';
import { ChannelInfo } from 'src/twitch/interfaces/channel-info.interface';
import { TwitchService } from 'src/twitch/twitch.service';

@Injectable()
export class AlarmService {
  private streamers = [
    { login: 'woowakgood', url: process.env.URL_WAKGOOD, isLive: false },
    { login: 'vo_ine', url: process.env.URL_INE, isLive: false },
    { login: 'jingburger', url: process.env.URL_JINGBURGUR, isLive: false },
    { login: 'lilpaaaaaa', url: process.env.URL_LILPA, isLive: false },
    { login: 'cotton__123', url: process.env.URL_JURURU, isLive: false },
    { login: 'gosegugosegu', url: process.env.URL_GOSEGU, isLive: false },
    { login: 'viichan6', url: process.env.URL_VIICHAN, isLive: false },
    { login: 'sonycast_', url: process.env.URL_SONYCAST, isLive: false },
    // {
    //   login: 'chunyangkr',
    //   url: process.env.URL_CHUNYANG,
    //   isLive: false,
    // },
  ];

  constructor(private readonly twitchService: TwitchService) {
    this.run();
  }

  private async getStreamInfo(
    login: string,
  ): Promise<{ title: string; gameName: string; startedAt: string }> {
    const result: ChannelInfo = await this.twitchService.searchChannel(login);

    if (result) {
      return {
        title: result.title,
        gameName: result.game_name,
        startedAt: result.started_at,
      };
    } else {
      return null;
    }
  }

  private run() {
    const intervalMs = 1000 * 60;

    setInterval(() => {
      this.streamers.forEach(async (streamer) => {
        const streamInfo = await this.getStreamInfo(streamer.login);

        if (streamInfo) {
          if (streamer.isLive === false) {
            try {
              // 뱅온 알람
              const embed = new EmbedBuilder()
                .setTitle(streamInfo.title)
                .setDescription(streamInfo.gameName)
                .setFooter({
                  text: new Date(streamInfo.startedAt).toLocaleString(),
                });

              await axios.post(streamer.url, { embeds: [embed] });
              streamer.isLive = true;
            } catch (error) {
              if (error.response) console.log(error.response.status);
              else console.log(error);
            }
          }
        } else {
          streamer.isLive = false;
        }
      });
    }, intervalMs);
  }
}
