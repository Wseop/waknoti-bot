import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { ChannelInfo } from './interfaces/channel-info.interface';
import puppeteer from 'puppeteer';
import { load } from 'cheerio';
import { ChatLog } from './interfaces/chat-log.interface';
import { getCurrentDate } from 'src/utils/date';

@Injectable()
export class TwitchService {
  private accessToken: string = '';

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

  // broadcaster의 채팅 내역 가져오기
  async getChatLogs(
    broadcasterLogin: string,
    chatName: string,
  ): Promise<ChatLog[]> {
    const url = `https://www.twitch.tv/popout/${broadcasterLogin}/chat`;
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: 'google-chrome-stable',
    });
    const page = await browser.newPage();
    await page.goto(url);
    // 사이트 로딩 대기
    await new Promise((_) => setTimeout(_, 5000));

    // 채팅 로그 parsing
    const $ = load(await page.content());
    const $chats = $(
      '#root > div > div.Layout-sc-1xcs6mc-0.htmBdw > div > div > section > div > div.Layout-sc-1xcs6mc-0.InjectLayout-sc-1i43xsx-0.chat-list--default.dvjzkE.font-scale--default > div.Layout-sc-1xcs6mc-0.InjectLayout-sc-1i43xsx-0.iUUpIE > div.scrollable-area > div.simplebar-scroll-content > div > div',
    );
    const chatCount = $chats.find('.chat-line__message').length;
    const result: ChatLog[] = [];

    for (let i = 1; i <= chatCount; i++) {
      const user = $(
        `#root > div > div.Layout-sc-1xcs6mc-0.htmBdw > div > div > section > div > div.Layout-sc-1xcs6mc-0.InjectLayout-sc-1i43xsx-0.chat-list--default.dvjzkE.font-scale--default > div.Layout-sc-1xcs6mc-0.InjectLayout-sc-1i43xsx-0.iUUpIE > div.scrollable-area > div.simplebar-scroll-content > div > div > div:nth-child(${i}) > div > div.Layout-sc-1xcs6mc-0.bZVrjx.chat-line__message-container > div > div > div > span.chat-line__username > span > span.chat-author__display-name`,
      ).text();
      const chat = $(
        `#root > div > div.Layout-sc-1xcs6mc-0.htmBdw > div > div > section > div > div.Layout-sc-1xcs6mc-0.InjectLayout-sc-1i43xsx-0.chat-list--default.dvjzkE.font-scale--default > div.Layout-sc-1xcs6mc-0.InjectLayout-sc-1i43xsx-0.iUUpIE > div.scrollable-area > div.simplebar-scroll-content > div > div > div:nth-child(${i}) > div > div.Layout-sc-1xcs6mc-0.bZVrjx.chat-line__message-container > div > div > span:nth-child(3) > span`,
      ).text();

      // broadcaster가 작성한 채팅만 결과에 추가
      if (user === chatName) {
        result.push({
          user,
          chat,
          date: await getCurrentDate(),
        });
      }
    }

    await browser.close();

    return result;
  }
}
