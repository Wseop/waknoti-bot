import { Injectable } from '@nestjs/common';
import { load } from 'cheerio';
import { Article } from './interfaces/article.interface';
import { BrowserService } from 'src/browser/browser.service';

@Injectable()
export class WakzooService {
  private url = 'https://cafe.naver.com/steamindiegame';
  private articleIds: string[] = [];

  constructor(private readonly browserService: BrowserService) {}

  // 왁물원 최신글 목록에서 members가 작성한 게시글만 가져오기
  async getMembersArticles(members: string[]): Promise<Article[]> {
    const articles: Article[] = [];
    const page = await this.browserService.newPage();

    // 전체글보기
    try {
      await page.goto(this.url);
      await page.waitForSelector('#menuLink0');
      await page.click('#menuLink0');
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

        if (members.includes(writer) && !this.articleIds.includes(articleId)) {
          this.articleIds.push(articleId);
          articles.push({ writer, title, articleId });
        }
      }
    } catch (error) {
      console.log('getMembersArticles failed');
    } finally {
      await page.close();

      return articles;
    }
  }
}
