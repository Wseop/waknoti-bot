import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { EmbedBuilder } from 'discord.js';
import { ChannelInfo } from 'src/twitch/interfaces/channel-info.interface';
import { TwitchService } from 'src/twitch/twitch.service';
import { Article } from 'src/wakzoo/interfaces/article.interface';
import { WakzooService } from 'src/wakzoo/wakzoo.service';

@Injectable()
export class AlarmService {
  private members = [
    {
      wakzoo: '우왁굳',
      login: 'woowakgood',
      url: process.env.URL_WAKGOOD,
      isLive: false,
    },
    {
      wakzoo: '아이네',
      login: 'vo_ine',
      url: process.env.URL_INE,
      isLive: false,
    },
    {
      wakzoo: '징버거',
      login: 'jingburger',
      url: process.env.URL_JINGBURGUR,
      isLive: false,
    },
    {
      wakzoo: '릴파 LILPA',
      login: 'lilpaaaaaa',
      url: process.env.URL_LILPA,
      isLive: false,
    },
    {
      wakzoo: '주르르',
      login: 'cotton__123',
      url: process.env.URL_JURURU,
      isLive: false,
    },
    {
      wakzoo: '고세구',
      login: 'gosegugosegu',
      url: process.env.URL_GOSEGU,
      isLive: false,
    },
    {
      wakzoo: '비챤',
      login: 'viichan6',
      url: process.env.URL_VIICHAN,
      isLive: false,
    },
    {
      wakzoo: '-',
      login: 'sonycast_',
      url: process.env.URL_SONYCAST,
      isLive: false,
    },
    // {
    //   wakzoo: '천양',
    //   login: 'chunyangkr',
    //   url: process.env.URL_CHUNYANG,
    //   isLive: false,
    // },
  ];

  constructor(
    private readonly twitchService: TwitchService,
    private readonly wakzooService: WakzooService,
  ) {
    this.alarmBangon();
    this.alarmWakzooNotice();
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

  private alarmBangon() {
    const intervalMs = 1000 * 60;

    setInterval(() => {
      this.members.forEach(async (member) => {
        const streamInfo = await this.getStreamInfo(member.login);

        if (streamInfo) {
          if (member.isLive === false) {
            try {
              // 뱅온 알람
              const embed = new EmbedBuilder()
                .setTitle(streamInfo.title)
                .setDescription(streamInfo.gameName)
                .setFooter({
                  text: new Date(streamInfo.startedAt).toLocaleString(),
                });

              await axios.post(member.url, { embeds: [embed] });
              member.isLive = true;
            } catch (error) {
              if (error.response) console.log(error.response.status);
              else console.log(error);
            }
          }
        } else {
          member.isLive = false;
        }
      });
    }, intervalMs);
  }

  private alarmWakzooNotice() {
    const intervalMs = 1000 * 60;

    setInterval(async () => {
      const articles: Article[] = await this.wakzooService.getMembersArticles();

      articles.forEach(async (article) => {
        this.members.forEach(async (member) => {
          if (member.wakzoo === article.writer) {
            try {
              // 왁물원 공지 알람
              const embed = new EmbedBuilder()
                .setTitle('[왁물원 새글]')
                .setDescription(article.title)
                .setFooter({ text: article.date });

              await axios.post(member.url, { embeds: [embed] });
            } catch (error) {
              if (error.response) console.log(error.response.status);
              else console.log(error);
            }
          }
        });
      });
    }, intervalMs);
  }
}
