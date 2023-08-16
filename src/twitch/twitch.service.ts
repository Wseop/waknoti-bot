import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { ChannelInfo } from './interfaces/channel-info.interface';
import puppeteer, { Browser } from 'puppeteer';
import { load } from 'cheerio';
import { ChatLog } from './interfaces/chat-log.interface';
import { getCurrentDate } from 'src/utils/date';

@Injectable()
export class TwitchService {
  private accessToken: string = '';
  private browser: Browser = null;
  private pages = {};
  private chatLogs = {};

  constructor() {
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
      if (error.response) console.log(error.response);
      else console.log(error);
    }
  }

  // 채널 정보 검색
  async searchChannel(broadcasterLogin: string): Promise<ChannelInfo> {
    const url = `https://api.twitch.tv/helix/search/channels?query=${broadcasterLogin}&live_only=true`;

    if (this.accessToken) {
      try {
        const result = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Client-Id': process.env.CLIENT_ID,
          },
        });

        let channel: ChannelInfo = null;
        if (result?.data?.data?.length > 0) {
          result.data.data.forEach((value: ChannelInfo) => {
            if (value.broadcaster_login === broadcasterLogin) channel = value;
          });
        }
        return channel;
      } catch (error) {
        if (error.response) console.log(error.response);
        else console.log(error);
      }
    } else {
      return null;
    }
  }

  async watchChat(broadcasterLogin: string, chatName: string) {
    const url = `https://www.twitch.tv/popout/${broadcasterLogin}/chat`;
    const intervalMs = 1000 * 60;

    // 열린 browser가 없으면 새로 launch
    if (this.browser === null) {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath: 'google-chrome-stable',
      });
    }

    this.pages[broadcasterLogin] = await this.browser.newPage();
    this.chatLogs[broadcasterLogin] = [];

    try {
      await this.pages[broadcasterLogin].goto(url);

      console.log(`start watch chat - ${url}`);

      // intervalMs마다 채팅 로그 업데이트
      setInterval(async () => {
        // 채팅 로그 parsing
        const $ = load(await this.pages[broadcasterLogin].content());
        const $chats = $(
          '#root > div > div.Layout-sc-1xcs6mc-0.htmBdw > div > div > section > div > div.Layout-sc-1xcs6mc-0.InjectLayout-sc-1i43xsx-0.chat-list--default.dvjzkE.font-scale--default > div.Layout-sc-1xcs6mc-0.InjectLayout-sc-1i43xsx-0.iUUpIE > div.scrollable-area > div.simplebar-scroll-content > div > div',
        );
        const chatCount = $chats.find('.chat-line__message').length;

        for (let i = 1; i <= chatCount; i++) {
          const user = $(
            `#root > div > div.Layout-sc-1xcs6mc-0.htmBdw > div > div > section > div > div.Layout-sc-1xcs6mc-0.InjectLayout-sc-1i43xsx-0.chat-list--default.dvjzkE.font-scale--default > div.Layout-sc-1xcs6mc-0.InjectLayout-sc-1i43xsx-0.iUUpIE > div.scrollable-area > div.simplebar-scroll-content > div > div > div:nth-child(${i}) > div > div.Layout-sc-1xcs6mc-0.bZVrjx.chat-line__message-container > div > div > div > span.chat-line__username > span > span.chat-author__display-name`,
          ).text();
          const chat = $(
            `#root > div > div.Layout-sc-1xcs6mc-0.htmBdw > div > div > section > div > div.Layout-sc-1xcs6mc-0.InjectLayout-sc-1i43xsx-0.chat-list--default.dvjzkE.font-scale--default > div.Layout-sc-1xcs6mc-0.InjectLayout-sc-1i43xsx-0.iUUpIE > div.scrollable-area > div.simplebar-scroll-content > div > div > div:nth-child(${i}) > div > div.Layout-sc-1xcs6mc-0.bZVrjx.chat-line__message-container > div > div > span:nth-child(3) > span`,
          ).text();

          // broadcaster의 채팅 로그 기록
          if (
            user === chatName &&
            !this.chatLogs[broadcasterLogin].includes(chat)
          ) {
            this.chatLogs[broadcasterLogin].push({
              user,
              chat,
              date: await getCurrentDate(),
            });
          }
        }
      }, intervalMs);
    } catch (error) {
      await this.pages[broadcasterLogin].close();
      this.pages[broadcasterLogin] = null;
      this.chatLogs[broadcasterLogin] = null;
      console.log(`watchChat failed - ${url}`);
    }
  }

  async getChatLog(broadcasterLogin: string): Promise<ChatLog[]> {
    // 채팅 로그 복사 후 refresh
    const chatLogs = [...this.chatLogs[broadcasterLogin]];

    this.chatLogs[broadcasterLogin] = [];
    this.pages[broadcasterLogin].reload();

    return chatLogs;
  }
}
