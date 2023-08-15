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
      broadcasterLogin: 'woowakgood',
      chatName: '우왁굳',
      url: process.env.URL_WAKGOOD,
      isLive: false,
    },
    {
      wakzoo: '아이네',
      broadcasterLogin: 'vo_ine',
      chatName: '아이네_',
      url: process.env.URL_INE,
      isLive: false,
    },
    {
      wakzoo: '징버거',
      broadcasterLogin: 'jingburger',
      chatName: '징버거',
      url: process.env.URL_JINGBURGUR,
      isLive: false,
    },
    {
      wakzoo: '릴파 LILPA',
      broadcasterLogin: 'lilpaaaaaa',
      chatName: '릴파_',
      url: process.env.URL_LILPA,
      isLive: false,
    },
    {
      wakzoo: '주르르',
      broadcasterLogin: 'cotton__123',
      chatName: '주르르',
      url: process.env.URL_JURURU,
      isLive: false,
    },
    {
      wakzoo: '고세구',
      broadcasterLogin: 'gosegugosegu',
      chatName: '고세구___',
      url: process.env.URL_GOSEGU,
      isLive: false,
    },
    {
      wakzoo: '비챤',
      broadcasterLogin: 'viichan6',
      chatName: '비챤_',
      url: process.env.URL_VIICHAN,
      isLive: false,
    },
    {
      wakzoo: '-',
      broadcasterLogin: 'sonycast_',
      chatName: '소니쇼',
      url: process.env.URL_SONYCAST,
      isLive: false,
    },
  ];
  private chatLogs = {
    우왁굳: [],
    아이네_: [],
    징버거: [],
    릴파_: [],
    주르르: [],
    고세구___: [],
    비챤_: [],
    소니쇼: [],
  };

  constructor(
    private readonly twitchService: TwitchService,
    private readonly wakzooService: WakzooService,
  ) {
    this.alarmBangon();
    this.alarmWakzooNotice();
    this.alarmTwitchChat();
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
        const streamInfo = await this.getStreamInfo(member.broadcasterLogin);

        if (streamInfo) {
          if (member.isLive === false) {
            try {
              // 뱅온 알람
              const embed = new EmbedBuilder()
                .setTitle('[뱅온]')
                .setDescription(streamInfo.title)
                .setFooter({
                  text: streamInfo.gameName,
                })
                .setColor([169, 112, 255]);

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
                .setColor([3, 199, 90]);

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

  private alarmTwitchChat() {
    const intervalMs = 1000 * 60;

    setInterval(async () => {
      this.members.forEach(async (member) => {
        const chatLogs = await this.twitchService.getChatLogs(
          member.broadcasterLogin,
          member.chatName,
        );

        chatLogs.forEach(async (chatLog) => {
          if (!this.chatLogs[chatLog.user].includes(chatLog.chat)) {
            this.chatLogs[chatLog.user].push(chatLog.chat);

            try {
              // 트위치 채팅 알람
              const embed = new EmbedBuilder()
                .setTitle('[트위치 채팅]')
                .setDescription(chatLog.chat);

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
