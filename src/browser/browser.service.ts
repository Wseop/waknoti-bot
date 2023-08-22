import { Injectable } from '@nestjs/common';
import puppeteer, { Browser, HTTPRequest, Page } from 'puppeteer';

@Injectable()
export class BrowserService {
  private browser: Browser = null;

  constructor() {}

  private async launchBrowser() {
    if (this.browser === null) {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath: 'google-chrome-stable',
      });
    }
  }

  async refreshBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      await this.launchBrowser();
    }
  }

  async newPage(): Promise<Page> {
    await this.launchBrowser();

    const page: Page = await this.browser.newPage();

    // 불필요한 resource 차단
    await page.setRequestInterception(true);
    page.on('request', (req: HTTPRequest) => {
      if (
        req.resourceType() === 'image' ||
        //req.resourceType() === 'stylesheet' ||
        req.resourceType() === 'font'
      ) {
        req.abort();
      } else {
        req.continue();
      }
    });

    return page;
  }
}
