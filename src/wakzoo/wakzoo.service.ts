import { Injectable } from '@nestjs/common';
import { load } from 'cheerio';
import puppeteer from 'puppeteer';
import { Article } from './interfaces/article.interface';

@Injectable()
export class WakzooService {
  private url = 'https://cafe.naver.com/steamindiegame';
  private members = [
    '우왁굳',
    '아이네',
    '징버거',
    '릴파 LILPA',
    '주르르',
    '고세구',
    '비챤',
  ];
  private articleIds: string[] = [];

  constructor() {}

  // 왁물원 최신글 목록에서 members가 작성한 게시글만 가져오기
  async getMembersArticles(): Promise<Article[]> {
    const articles: Article[] = [];
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: 'google-chrome-stable',
      timeout: 0,
    });
    const page = await browser.newPage();

    // 전체글보기
    try {
      await page.goto(this.url, { timeout: 0 });
      await page.waitForSelector('#menuLink0');
      await page.click('#menuLink0');

      // 사이트 로딩 대기
      await new Promise((_) => setTimeout(_, 3000));

      const cafeMainFrame = await (await page.$('#cafe_main')).contentFrame();
      const $ = load(await cafeMainFrame.content());

      // 게시글 parsing
      for (let i = 1; i <= 15; i++) {
        const writer = $(
          `#main-area > div:nth-child(4) > table > tbody > tr:nth-child(${i}) > td.td_name > div > table > tbody > tr > td > a`,
        ).text();
        const date = $(
          `#main-area > div:nth-child(4) > table > tbody > tr:nth-child(${i}) > td.td_date`,
        ).text();
        const $article = $(
          `#main-area > div:nth-child(4) > table > tbody > tr:nth-child(${i}) > td.td_article > div.board-list > div > a`,
        );
        const title = $article.text().replace(/\s+/g, '').replace(']', '] ');
        const articleHref = $article.attr('href');
        const articleIdIndex =
          articleHref.indexOf('articleid=') + 'articleid='.length;
        const articleId = articleHref.substring(
          articleIdIndex,
          articleHref.indexOf('&', articleIdIndex),
        );

        if (
          this.members.includes(writer) &&
          !this.articleIds.includes(articleId)
        ) {
          this.articleIds.push(articleId);
          articles.push({ writer, title, date });
        }
      }
    } catch (error) {
      console.log('왁물원 공지 불러오기 실패');
    } finally {
      await browser.close();
      return articles;
    }
  }
}
