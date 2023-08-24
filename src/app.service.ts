import { Injectable, Logger } from '@nestjs/common';
import { TwitchService } from './twitch/twitch.service';
import { ChannelInfo } from './twitch/interfaces/channel-info.interface';
import { EmbedBuilder } from 'discord.js';
import axios from 'axios';
import { WakzooService } from './wakzoo/wakzoo.service';
import { Article } from './wakzoo/interfaces/article.interface';
import { Page } from 'puppeteer';
import { ChatLog } from './twitch/interfaces/chat-log.interface';

class Member {
  wakzoo: string;
  broadcasterLogin: string;
  chatName: string;
  url: string;
  isLive: boolean;
  twitchChat: Page;
}

@Injectable()
export class AppService {
  private members: Member[] = [
    {
      wakzoo: '우왁굳',
      broadcasterLogin: 'woowakgood',
      chatName: '우왁굳',
      url: process.env.URL_WAKGOOD,
      isLive: false,
      twitchChat: null,
    },
    {
      wakzoo: '아이네',
      broadcasterLogin: 'vo_ine',
      chatName: '아이네_',
      url: process.env.URL_INE,
      isLive: false,
      twitchChat: null,
    },
    {
      wakzoo: '징버거',
      broadcasterLogin: 'jingburger',
      chatName: '징버거',
      url: process.env.URL_JINGBURGUR,
      isLive: false,
      twitchChat: null,
    },
    {
      wakzoo: '릴파 LILPA',
      broadcasterLogin: 'lilpaaaaaa',
      chatName: '릴파_',
      url: process.env.URL_LILPA,
      isLive: false,
      twitchChat: null,
    },
    {
      wakzoo: '주르르',
      broadcasterLogin: 'cotton__123',
      chatName: '주르르',
      url: process.env.URL_JURURU,
      isLive: false,
      twitchChat: null,
    },
    {
      wakzoo: '고세구',
      broadcasterLogin: 'gosegugosegu',
      chatName: '고세구___',
      url: process.env.URL_GOSEGU,
      isLive: false,
      twitchChat: null,
    },
    {
      wakzoo: '비챤',
      broadcasterLogin: 'viichan6',
      chatName: '비챤_',
      url: process.env.URL_VIICHAN,
      isLive: false,
      twitchChat: null,
    },
    {
      wakzoo: '-',
      broadcasterLogin: 'sonycast_',
      chatName: '소니쇼',
      url: process.env.URL_SONYCAST,
      isLive: false,
      twitchChat: null,
    },
  ];
  private bangOnInterval = 1000 * 30;
  private wakzooInterval = 1000 * 60;
  private chatInterval = 1000 * 60 * 3;
  private readonly logger = new Logger(AppService.name);

  constructor(
    private readonly twitchService: TwitchService,
    private readonly wakzooService: WakzooService,
  ) {
    // notiBangOn
    setInterval(() => {
      this.notiBangOn();
    }, this.bangOnInterval);

    // notiWakzoo
    setInterval(() => {
      this.notiWakzoo();
    }, this.wakzooInterval);

    // notiTwitchChat
    setInterval(() => {
      this.notiTwitchChat();
    }, this.chatInterval);
  }

  private async notiBangOn() {
    this.members.forEach(async (member: Member) => {
      const channelInfo: ChannelInfo = await this.twitchService.searchChannel(
        member.broadcasterLogin,
      );

      if (channelInfo?.is_live) {
        if (!member.isLive) {
          const embed = new EmbedBuilder()
            .setTitle('[뱅온!]')
            .setURL(`https://www.twitch.tv/${member.broadcasterLogin}`)
            .setDescription(channelInfo.title)
            .setFooter({ text: channelInfo.game_name })
            .setColor([169, 122, 255]);

          try {
            await axios.post(member.url, { embeds: [embed] });

            // 방송 시작 시 상태 업데이트 및 채팅 모니터링 종료
            member.isLive = true;
            if (member.twitchChat) {
              await member.twitchChat.close();
              member.twitchChat = null;
            }
          } catch (error) {
            if (error.response) this.logger.error(error.response.status);
            else if (error.request) this.logger.error(error.request);
            else this.logger.error(error.message);
          }
        }
      } else {
        // 방송 종료시 상태 업데이트 및 채팅 모니터링 시작
        member.isLive = false;
        if (!member.twitchChat) {
          member.twitchChat = await this.twitchService.openTwitchChat(
            member.broadcasterLogin,
          );
        }
      }
    });
  }

  private async notiWakzoo() {
    const wakzooNames: string[] = this.members.map((member: Member) => {
      return member.wakzoo;
    });
    const articles: Article[] = await this.wakzooService.getMembersArticles(
      wakzooNames,
    );

    articles.forEach(async (article: Article) => {
      // 왁물원 공지 전송
      const embed = new EmbedBuilder()
        .setTitle('[왁물원 공지!]')
        .setDescription(article.title)
        .setURL(`https://cafe.naver.com/steamindiegame/${article.articleId}`)
        .setColor([3, 199, 90]);
      const member: Member = this.members.find((member: Member) => {
        return member.wakzoo === article.writer;
      });

      if (member) {
        try {
          await axios.post(member.url, { embeds: [embed] });
        } catch (error) {
          if (error.response) this.logger.error(error.response.status);
          else if (error.request) this.logger.error(error.request);
          else this.logger.error(error.message);
        }
      }
    });
  }

  private async notiTwitchChat() {
    this.members.forEach(async (member: Member) => {
      if (member.twitchChat) {
        const chatLogs: ChatLog[] = await this.twitchService.getChatLog(
          member.twitchChat,
          member.chatName,
        );

        if (chatLogs.length > 0) {
          const embed = new EmbedBuilder().setTitle('[트위치 채팅]');

          for (let i = 0; i < 25 && i < chatLogs.length; i++) {
            embed.addFields({
              name: chatLogs[i].user,
              value: chatLogs[i].chat,
            });
          }

          try {
            await axios.post(member.url, { embeds: [embed] });
          } catch (error) {
            if (error.response) this.logger.error(error.response.status);
            else if (error.request) this.logger.error(error.request);
            else this.logger.error(error.message);
          } finally {
            member.twitchChat.reload();
          }
        }
      }
    });
  }
}
