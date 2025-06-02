import { fetchApi, fetchProto, fetchText } from '@libs/fetch';
import { Plugin } from '@typings/plugin';
import { Filters } from '@libs/filterInputs';
import { load as loadCheerio } from 'cheerio';
import { defaultCover } from '@libs/defaultCover';
import { NovelStatus } from '@libs/novelStatus';
import * as cheerio from 'cheerio';
// import { isUrlAbsolute } from '@libs/isAbsoluteUrl';
// import { storage, localStorage, sessionStorage } from '@libs/storage';
// import { encode, decode } from 'urlencode';
// import dayjs from 'dayjs';
// import { Parser } from 'htmlparser2';

class Zlibrary_plugin implements Plugin.PluginBase {
  id = 'zlibrary';
  name = 'Z Library';
  icon = 'src/en/zlib/images.png';
  site = 'https://z-lib.fm';
  version = '1.0.0';
  filters: Filters | undefined = undefined;
  headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  };
  imageRequestInit?: Plugin.ImageRequestInit | undefined = {
    headers: {
      'referrer': this.site,
    },
  };
  //flag indicates whether access to LocalStorage, SesesionStorage is required.
  webStorageUtilized?: boolean;

  async popularNovels(
    pageNo: number,
    {
      showLatestNovels,
      filters,
    }: Plugin.PopularNovelsOptions<typeof this.filters>,
  ): Promise<Plugin.NovelItem[]> {
    const novels: Plugin.NovelItem[] = [];

    const html: string = await this.getHtml(this.site + '/popular');

    const $: cheerio.CheerioAPI = loadCheerio(html);

    $('div.masonry-endless')
      .find('div.item')
      .each((idx, element) => {
        // Wrap the raw element with Cheerio so we can use Cheerio methods
        const el = $(element);
        const title = el.find('z-cover').attr('title');
        const url = `${el.find('a').attr('href')}`;
        const cover = el.find('z-cover').find('img').attr('src');
        const name = `${title}`;
        const path = url.replace('/book/', '');
        // Push the extracted data into the array
        novels.push({
          name,
          path,
          cover,
        });
      });

    return novels;
  }

  async getHtml(url: string) {
    const html = await fetch(url);
    const data = await html.text();
    return data;
  }

  async cleanUp(url: string, removePart: string) {
    return url.replace(removePart, '');
  }
  async parseNovel(novelPath: string): Promise<Plugin.SourceNovel> {
    //novelPath = await this.cleanUp(novelPath, '/book');
    novelPath = await this.cleanUp(novelPath, '?dsource=mostpopular');

    //if the webview on android works now then add this cleanup thing to the main functions

    console.log(novelPath);
    console.log(this.site + `${novelPath}`);
    const novelpage = await this.getHtml(this.site + `/book/${novelPath}`);

    const $ = loadCheerio(novelpage);

    const novel: Plugin.SourceNovel = {
      path: novelPath,
      name: $('div.col-sm-9').find('h1').text().trim() || 'Untitled',
    };

    // TODO: get here data from the site and
    // fill-in the novel object with the relevant data

    $('div.row.cardBooks')
      .find('div')
      .each((idx, element) => {
        const el = $(element);
        novel.author = el.find('z-cover').attr('author') || 'Untitled';
        novel.cover = $('z-cover img').attr('src') || defaultCover;
        novel.genres =
          $('div.col-sm-9 bookProperty.property_categories .property_value a')
            .text()
            .trim() || 'Unknown Genre';
        novel.status = NovelStatus.Completed;

        const description =
          $('div#bookDescriptionBox').text().trim() ||
          'No description available';
        const language =
          $(
            'div.col-sm-9 bookProperty.property_language .property_value.text-capitalize',
          )
            .text()
            .trim() || 'Unknown language';
        const publisher =
          $('div.col-sm-9 bookProperty.property_publisher .property_value')
            .text()
            .trim() || 'Unknown publisher';
        const series =
          $('div.col-sm-9 bookProperty.property_series .property_value')
            .text()
            .trim() || 'Unknown series';
        const volume =
          $('div.col-sm-9 bookProperty.property_volume .property_value')
            .text()
            .trim() || 'Unknown volume';
        const file_size =
          $('div.col-sm-9 bookProperty.property_file .property_value')
            .text()
            .trim() || 'Unknown file and size';
        const year =
          $('div.col-sm-9 bookProperty.property_year .property_value')
            .text()
            .trim() || 'Unknown year';

        novel.summary = `${description}

          Language: ${language}
          Publisher: ${publisher}
          Series: ${series}
          Volume: ${volume}
          Year: ${year}
          File, Size: ${file_size}`;

        // novel.name = el.find('z-cover').attr('title') || 'Untitled';
        // novel.artist = '';

        const chapters: Plugin.ChapterItem[] = [];

        // TODO: here parse the chapter list

        // TODO: add each chapter to the list using
        const chapter: Plugin.ChapterItem = {
          name: '',
          path: '',
          releaseTime: '',
          chapterNumber: 0,
        };
        chapters.push(chapter);
        novel.chapters = chapters;
      });
    return novel;
  }
  async parseChapter(chapterPath: string): Promise<string> {
    // parse chapter text here
    const chapterText = '';
    return chapterText;
  }

  async searchNovels(
    searchTerm: string,
    pageNo: number,
  ): Promise<Plugin.NovelItem[]> {
    const novels: Plugin.NovelItem[] = [];

    const html: string = await this.getHtml(
      this.site + '/s/' + searchTerm.trim(),
    );

    //I know the await does nothing here but don't remove it pls!
    const $: cheerio.CheerioAPI = await loadCheerio(html);

    $('#searchResultBox')
      .find('div.book-item')
      .each((idx, element) => {
        // Wrap the raw element with Cheerio so we can use Cheerio methods
        const el = $(element);
        const title = el.find('div[slot=title]').text().trim();
        const url = el.find('z-bookcard').attr('href');
        const cover = el.find('z-bookcard').find('img').attr('data-src');
        const name = `${title}`;
        const path = `${url}`;
        // Push the extracted data into the array
        novels.push({
          name,
          path,
          cover,
        });
      });

    return novels;
  }

  resolveUrl = (path: string, isNovel?: boolean) =>
    this.site + (isNovel ? '/book/' : '/chapter/') + path;
}

export default new Zlibrary_plugin();
