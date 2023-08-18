import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { ChannelInfo } from './interfaces/channel-info.interface';
import puppeteer, { Browser } from 'puppeteer';
import { load } from 'cheerio';
import { getCurrentDate } from 'src/utils/date';
import { EmbedBuilder } from 'discord.js';
import { ChatLog } from './interfaces/chat-log.interface';

@Injectable()
export class TwitchService {
  private accessToken: string = '';
  private browser: Browser = null;
  private pages = {};
  private chatLogs = {};
  private postUrl = {};
  private chatInterval = {};

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

  async watchChat(broadcasterLogin: string, chatName: string, postUrl: string) {
    const url = `https://www.twitch.tv/popout/${broadcasterLogin}/chat`;
    const intervalMs = 1000 * 60;

    if (this.chatInterval[broadcasterLogin]) return;

    // 열린 browser가 없으면 새로 launch
    if (this.browser === null) {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath: 'google-chrome-stable',
      });
    }

    // 지켜볼 chat 정보 등록
    if (!this.pages[broadcasterLogin])
      this.pages[broadcasterLogin] = await this.browser.newPage();
    this.chatLogs[broadcasterLogin] = [];
    this.postUrl[broadcasterLogin] = postUrl;

    try {
      await this.pages[broadcasterLogin].goto(url);

      console.log(`start watch chat - ${broadcasterLogin}`);

      this.chatInterval[broadcasterLogin] = setInterval(async () => {
        const $ = load(await this.pages[broadcasterLogin].content());
        const $chats = $(
          '#root > div > div.Layout-sc-1xcs6mc-0.htmBdw > div > div > section > div > div.Layout-sc-1xcs6mc-0.InjectLayout-sc-1i43xsx-0.chat-list--default.dvjzkE.font-scale--default > div.Layout-sc-1xcs6mc-0.InjectLayout-sc-1i43xsx-0.iUUpIE > div.scrollable-area > div.simplebar-scroll-content > div > div',
        );
        const chatCount = $chats.find('.chat-line__message').length;

        // chat log 기록
        for (let i = 1; i <= chatCount; i++) {
          const user = $(
            `#root > div > div.Layout-sc-1xcs6mc-0.htmBdw > div > div > section > div > div.Layout-sc-1xcs6mc-0.InjectLayout-sc-1i43xsx-0.chat-list--default.dvjzkE.font-scale--default > div.Layout-sc-1xcs6mc-0.InjectLayout-sc-1i43xsx-0.iUUpIE > div.scrollable-area > div.simplebar-scroll-content > div > div > div:nth-child(${i}) > div > div.Layout-sc-1xcs6mc-0.bZVrjx.chat-line__message-container > div > div > div > span.chat-line__username > span > span.chat-author__display-name`,
          ).text();
          const chat = $(
            `#root > div > div.Layout-sc-1xcs6mc-0.htmBdw > div > div > section > div > div.Layout-sc-1xcs6mc-0.InjectLayout-sc-1i43xsx-0.chat-list--default.dvjzkE.font-scale--default > div.Layout-sc-1xcs6mc-0.InjectLayout-sc-1i43xsx-0.iUUpIE > div.scrollable-area > div.simplebar-scroll-content > div > div > div:nth-child(${i}) > div > div.Layout-sc-1xcs6mc-0.bZVrjx.chat-line__message-container > div > div > span:nth-child(3) > span`,
          )
            .text()
            .trim();

          if (
            chat &&
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

        // chat log 전송
        let send = false;
        const embed = new EmbedBuilder().setTitle('[트위치 채팅]');

        for (
          let i = 0;
          i < 25 && this.chatLogs[broadcasterLogin].length > 0;
          i++
        ) {
          const chatLog: ChatLog = this.chatLogs[broadcasterLogin].shift();
          embed.addFields({ name: chatLog.date, value: chatLog.chat });
          send = true;
        }

        if (send) {
          await axios.post(this.postUrl[broadcasterLogin], { embeds: [embed] });
          await this.pages[broadcasterLogin].reload();
        }
      }, intervalMs);
    } catch (error) {
      await this.pages[broadcasterLogin].close();
      this.pages[broadcasterLogin] = null;
      this.chatLogs[broadcasterLogin] = null;
      console.log(`watchChat failed - ${url}`);
    }
  }

  async stopWatchChat(broadcasterLogin: string) {
    if (this.pages[broadcasterLogin])
      await this.pages[broadcasterLogin].close();
    this.pages[broadcasterLogin] = null;

    if (this.chatInterval[broadcasterLogin])
      clearInterval(this.chatInterval[broadcasterLogin]);
    this.chatInterval[broadcasterLogin] = null;

    console.log(`stop watch chat - ${broadcasterLogin}`);
  }
}
