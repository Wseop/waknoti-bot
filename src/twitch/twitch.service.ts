import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ChannelInfo } from './interfaces/channel-info.interface';
import { Page } from 'puppeteer';
import { load } from 'cheerio';
import { getCurrentDate } from 'src/utils/date';
import { ChatLog } from './interfaces/chat-log.interface';
import { BrowserService } from 'src/browser/browser.service';

@Injectable()
export class TwitchService {
  private accessToken: string = '';
  private readonly logger = new Logger(TwitchService.name);

  constructor(private readonly browserService: BrowserService) {
    this.refreshAccessToken();
  }

  private async refreshAccessToken() {
    const url = `https://id.twitch.tv/oauth2/token?client_id=${process.env.CLIENT_ID}&client_secret=${process.env.CLIENT_SECRET}&grant_type=client_credentials`;

    try {
      const result = await axios.post(url);

      this.accessToken = result.data.access_token;

      setTimeout(() => {
        this.refreshAccessToken();
      }, result.data.expires_in - 1000);
    } catch (error) {
      if (error.response) this.logger.error(error.response.status);
      else if (error.request) this.logger.error(error.request);
      else this.logger.error(error.message);
    }
  }

  // 채널 정보 검색
  async searchChannel(broadcasterLogin: string): Promise<ChannelInfo> {
    const url = `https://api.twitch.tv/helix/search/channels?query=${broadcasterLogin}&live_only=false`;

    if (this.accessToken) {
      let channelInfo: ChannelInfo = null;

      try {
        const result = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Client-Id': process.env.CLIENT_ID,
          },
        });

        if (result?.data?.data?.length > 0) {
          for (let i = 0; i < result.data.data.length; i++) {
            const data: ChannelInfo = result.data.data[i];

            if (data.broadcaster_login === broadcasterLogin) {
              channelInfo = data;
              break;
            }
          }
        }
      } catch (error) {
        if (error.response) this.logger.error(error.response.status);
        else if (error.request) this.logger.error(error.request);
        else this.logger.error(error.message);
      } finally {
        return channelInfo;
      }
    } else {
      return null;
    }
  }

  async openTwitchChat(broadcasterLogin: string): Promise<Page> {
    const page = await this.browserService.newPage();

    try {
      await page.goto(`https://www.twitch.tv/popout/${broadcasterLogin}/chat`);
      return page;
    } catch (error) {
      this.logger.error(error);
      return null;
    }
  }

  async getChatLog(page: Page, chatName: string): Promise<ChatLog[]> {
    const chatLogs: ChatLog[] = [];

    if (page) {
      const $ = load(await page.content());
      const $chat = $(
        '#root > div > div.Layout-sc-1xcs6mc-0.htmBdw > div > div > section > div > div.Layout-sc-1xcs6mc-0.InjectLayout-sc-1i43xsx-0.chat-list--default.dvjzkE.font-scale--default > div.Layout-sc-1xcs6mc-0.InjectLayout-sc-1i43xsx-0.iUUpIE > div.scrollable-area > div.simplebar-scroll-content > div > div',
      );

      if ($chat) {
        const chatCount = $chat.find('.chat-line__message').length;

        for (let i = 1; i <= chatCount; i++) {
          const user = $(
            `#root > div > div.Layout-sc-1xcs6mc-0.htmBdw > div > div > section > div > div.Layout-sc-1xcs6mc-0.InjectLayout-sc-1i43xsx-0.chat-list--default.dvjzkE.font-scale--default > div.Layout-sc-1xcs6mc-0.InjectLayout-sc-1i43xsx-0.iUUpIE > div.scrollable-area > div.simplebar-scroll-content > div > div > div:nth-child(${i}) > div > div.Layout-sc-1xcs6mc-0.bZVrjx.chat-line__message-container > div > div > div > span.chat-line__username > span > span.chat-author__display-name`,
          ).text();
          const chat = $(
            `#root > div > div.Layout-sc-1xcs6mc-0.htmBdw > div > div > section > div > div.Layout-sc-1xcs6mc-0.InjectLayout-sc-1i43xsx-0.chat-list--default.dvjzkE.font-scale--default > div.Layout-sc-1xcs6mc-0.InjectLayout-sc-1i43xsx-0.iUUpIE > div.scrollable-area > div.simplebar-scroll-content > div > div > div:nth-child(${i}) > div > div.Layout-sc-1xcs6mc-0.bZVrjx.chat-line__message-container > div > div > span:nth-child(3) > span`,
          )
            .text()
            .trim();

          if (chat && user === chatName) {
            chatLogs.push({
              user,
              chat,
              date: await getCurrentDate(),
            });
          }
        }
      }
    }

    return chatLogs;
  }
}
