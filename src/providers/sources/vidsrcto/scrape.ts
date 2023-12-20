import { load } from 'cheerio';

import { MovieMedia, ShowMedia } from '@/main/media';
import { decryptSourceUrl, vidSrcToBase } from '@/providers/sources/vidsrcto/common';
import { MovieScrapeContext, ScrapeContext, ShowScrapeContext } from '@/utils/context';

import { vidsrctoScraper } from '.';

interface SourcesResponse {
  result: [
    {
      id: string;
      title: 'Vidplay' | 'Filemoon';
    },
  ];
}

interface FetchResponse {
  status: number;
  result: {
    url: string;
  };
}

export async function getVidSrcToSourceDetails(ctx: ScrapeContext, sourcedId: string) {
  const data = await ctx.proxiedFetcher<FetchResponse>(`/ajax/embed/source/${sourcedId}`, {
    baseUrl: vidSrcToBase,
  });

  const encryptedSourceUrl = data.result.url;
  return decodeURIComponent(decryptSourceUrl(encryptedSourceUrl));
}

export async function getVidSrcToSourcesId(ctx: ShowScrapeContext | MovieScrapeContext) {
  let url = '';
  if (ctx.media.type === 'movie') {
    url = `/embed/movie/${ctx.media.tmdbId}`;
  }
  if (ctx.media.type === 'show') {
    url = `/embed/tv/${ctx.media.tmdbId}/${ctx.media.season.number}/${ctx.media.episode.number}`;
  }

  const data = await ctx.proxiedFetcher<string>(url, {
    baseUrl: vidSrcToBase,
  });
  const doc = load(data);
  const sourcesCode = doc('a[data-id]').attr('data-id');

  return sourcesCode;
}

export async function getVidSrcToSources(ctx: ScrapeContext, sourcedId: string | undefined) {
  const data = await ctx.proxiedFetcher<SourcesResponse>(`/ajax/embed/episode/${sourcedId}/sources`, {
    baseUrl: vidSrcToBase,
  });

  return data;
}
