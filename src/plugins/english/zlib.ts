import { Plugin } from '@typings/plugin';
import { Filters, FilterTypes } from '@libs/filterInputs';
import { load as loadCheerio } from 'cheerio';
import { defaultCover } from '@libs/defaultCover';
import { NovelStatus } from '@libs/novelStatus';
import * as cheerio from 'cheerio';
// import { isUrlAbsolute } from '@libs/isAbsoluteUrl';
// import { storage, localStorage, sessionStorage } from '@libs/storage';
// import { encode, decode } from 'urlencode';

class Zlibrary_plugin implements Plugin.PluginBase {
  id = 'zlib';
  name = 'Z-Library';
  icon = 'src/en/zlib/images.png';
  site = 'https://z-lib.fm';
  version = '1.0.0';

  filters: Filters = {
    yearFrom: {
      label: 'Year From',
      value: '',
      type: FilterTypes.TextInput,
    },
    yearTo: {
      label: 'Year To',
      value: '',
      type: FilterTypes.TextInput,
    },
    language: {
      label: 'Language',
      options: [
        { label: 'All', value: '' },
        { label: 'English', value: 'english' },
        { label: 'Japanese', value: 'japanese' },
        { label: 'Chinese', value: 'chinese' },
        { label: 'Korean', value: 'korean' },
        { label: 'French', value: 'french' },
        { label: 'German', value: 'german' },
        { label: 'Spanish', value: 'spanish' },
        { label: 'Bengali', value: 'bengali' },
      ],
      type: FilterTypes.Picker,
      value: 'english',
    },
    extension: {
      label: 'Extension',
      options: [
        { label: 'All', value: '' },
        { label: 'epub', value: 'epub' },
        { label: 'pdf', value: 'pdf' },
        { label: 'mobi', value: 'mobi' },
        { label: 'azw3', value: 'azw3' },
      ],
      type: FilterTypes.Picker,
      value: 'epub',
    },
  };

  imageRequestInit?: Plugin.ImageRequestInit | undefined = undefined;

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
        const path = `${url.replace(/^\/book\//, '')}`; //.replace('/book/', '');
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

  /*async cleanUp(url: string, removePart: string) {
    return url.replace(removePart, '');
  } */
  //Don't ask questions.
  async parseNovel(novelPath: string): Promise<Plugin.SourceNovel> {
    // The code under here breaks the plugin
    //
    // The code above here breaks the plugin
    const novelpage = await this.getHtml(`${this.site}/book/${novelPath}`);

    const $ = loadCheerio(novelpage);

    const novel: Plugin.SourceNovel = {
      path: novelPath,
      name: $('div.col-sm-9').find('h1').text().trim() || 'Untitled',
    };

    // TODO: get here data from the site and

    novel.name = `${$('div.col-sm-9').find('h1').text().trim()}`;
    // novel.artist = '';
    novel.author = `${$('z-cover').attr('author')}` || 'Unknown Author';
    novel.cover = `${$('z-cover img').attr('src')}` || defaultCover;
    novel.genres =
      `${$('div.col-sm-9 div.bookDetailsBox div.property_value a').text().trim()}` ||
      'Unknown Genre';
    novel.status = NovelStatus.Completed;

    const novelDescription = $('div.col-sm-9').find('#bookDescriptionBox');

    let formattedNovelDescription = '';

    novelDescription.contents().each((_, el) => {
      if (el.type === 'text') {
        formattedNovelDescription += $(el).text();
      } else if (el.type === 'tag' && el.tagName === 'br') {
        formattedNovelDescription += '\n';
      } else if (el.type === 'tag' && el.name === 'p') {
        const text = $(el).text().trim();
        if (text) {
          // Add double newline to separate paragraphs
          if (!formattedNovelDescription.endsWith('\n\n')) {
            formattedNovelDescription += '\n';
          }
          formattedNovelDescription += text;
        }
      }
    });

    formattedNovelDescription = formattedNovelDescription.trim();

    // Normalize spacing: remove excessive line breaks
    formattedNovelDescription = formattedNovelDescription.replace(
      /\n{2,}/g,
      '\n',
    );

    const showDesc: string =
      formattedNovelDescription || 'Description Unavailable';

    const content: string =
      $('div.col-sm-9 div.bookDetailsBox div.property_content_type')
        .find('span')
        .text()
        .trim() || 'Unavailable';

    const year: string =
      $('div.col-sm-9 div.bookDetailsBox div.property_year')
        .find('div.property_value')
        .text()
        .trim() || 'Unavailable';

    const publisher: string =
      $('div.col-sm-9 div.bookDetailsBox div.property_publisher')
        .find('div.property_value')
        .text()
        .trim() || 'Unavailable';

    const language: string =
      $('div.col-sm-9 div.bookDetailsBox div.property_language')
        .find('div.property_value')
        .text()
        .toUpperCase()
        .trim() || 'Unavailable';

    const pages: string =
      $('div.col-sm-9 div.bookDetailsBox div.property_pages')
        .find('div.property_value')
        .text()
        .trim() || 'Unavailable';

    const filetypeSize: string =
      $('div.col-sm-9 div.bookDetailsBox div.property__file')
        .find('div.property_value')
        .text()
        .trim() || 'Unavailable';

    const series: string =
      $('div.col-sm-9 div.bookDetailsBox div.property_series')
        .find('div.property_value')
        .text()
        .trim() || 'Unavailable';

    const volume: string =
      $('div.col-sm-9 div.bookDetailsBox div.property_volume')
        .find('div.property_value')
        .text()
        .trim() || 'Unavailable';

    novel.summary = `
    Language: ${language}\n
    Publisher: ${publisher}\n
    Series: ${series}\n
    Volume: ${volume}\n
    Year: ${year}\n
    Content Type: ${content}\n
    Pages: ${pages}\n
    Filet, Size: ${filetypeSize}
    ${showDesc}\n
      `;

    const chapters: Plugin.ChapterItem[] = [];

    const chapter: Plugin.ChapterItem = {
      name: `${$('div.col-sm-9').find('h1').text().trim()}`,
      path: `${$(
        'div.col-md-12 div section.book-actions-container div.book-details-button div.btn-group',
      )
        .eq(2)
        .find('a.btn')
        .attr('href')}`,
      releaseTime:
        $('div.col-sm-9 div.bookDetailsBox div.property_year')
          .find('div.property_value')
          .text()
          .trim() || 'Unavailable',
      chapterNumber: 0,
    };
    chapters.push(chapter);

    novel.chapters = chapters;
    return novel;
  }
  async parseChapter(chapterPath: string): Promise<string> {
    if (chapterPath) {
      const epubLink = `${this.site}${chapterPath}`;
      return `
          <p>
            <b>Click below to download the EPUB:</b><br/>
            <a href="${epubLink}">${epubLink}</a>
          </p>
        `;
    }

    return 'No content.';
  }

  async searchNovels(
    searchTerm: string,
    pageNo: number,
  ): Promise<Plugin.NovelItem[]> {
    const novels: Plugin.NovelItem[] = [];

    let url =
      this.site +
      '/s' +
      (searchTerm.trim() ? '/' + encodeURIComponent(searchTerm.trim()) : '');

    // Add filters if they exist
    if (this.filters) {
      const params = new URLSearchParams();

      if (this.filters.yearFrom.value) {
        params.append('yearFrom', this.filters.yearFrom.value.toString());
      }

      if (this.filters.yearTo.value) {
        params.append('yearTo', this.filters.yearTo.value.toString());
      }

      if (this.filters.language.value) {
        params.append('languages[]', this.filters.language.value.toString());
      }

      if (this.filters.extension.value) {
        params.append('extensions[]', this.filters.extension.value.toString());
      }

      if (params.toString()) {
        url += '/?' + params.toString();
      }
    }

    const html: string = await this.getHtml(url);

    //I know the await does nothing here but don't remove it pls!
    const $: cheerio.CheerioAPI = loadCheerio(html);

    $('#searchResultBox')
      .find('div.book-item')
      .each((idx, element) => {
        // Wrap the raw element with Cheerio so we can use Cheerio methods
        const el = $(element);
        const title = el.find('div[slot=title]').text().trim();
        const url = `${el.find('z-bookcard').attr('href')}`;
        const cover = el.find('z-bookcard').find('img').attr('data-src');
        const name = `${title}`;
        const path = `${url.replace(/^\/book\//, '')}`;

        novels.push({
          name,
          path,
          cover,
        });
      });

    return novels;
  }

  resolveUrl = (path: string, isNovel?: boolean) =>
    this.site + (isNovel ? '/book/' : '') + path;
}

export default new Zlibrary_plugin();
