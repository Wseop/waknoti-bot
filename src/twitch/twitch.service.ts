import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { ChannelInfo } from './interfaces/channel-info.interface';

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

  async searchChannel(broadcasterLogin: string): Promise<ChannelInfo> {
    const url = `https://api.twitch.tv/helix/search/channels?query=${broadcasterLogin}&live_only=true`;

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
  }
}
