import { flags } from '@/main/targets';
import { makeEmbed } from '@/providers/base';
import { SubtitleRes, keyPermutation } from '@/providers/sources/vidsrcto/common';
import { EmbedScrapeContext } from '@/utils/context';

import { Caption, getCaptionTypeFromUrl, labelToLanguageCode } from '../captions';

interface StreamRes {
  status: number;
  result: {
    sources: {
      file: string;
    }[];
    tracks: {
      file: string;
      kind: string;
    }[];
  };
}

async function getFutoken(ctx: EmbedScrapeContext, key: string, url: string): Promise<string> {
  const response = await ctx.fetcher<string>('https://vidplay.site/futoken', { headers: { Referer: url } });
  const match = response.match(/var\s+k\s*=\s*'([^']+)'/);
  if (!match || match.length < 2 || match[1] == null) {
    throw new Error('Failed to extract fuKey from the response');
  }
  const fuKey = match[1];
  const fuToken = `${fuKey},${Array.from({ length: key.length }, (_, i) =>
    (fuKey.charCodeAt(i % fuKey.length) + key.charCodeAt(i)).toString(),
  ).join(',')}`;
  return fuToken;
}

async function encodeId(ctx: EmbedScrapeContext, id: string): Promise<string> {
  const response = await ctx.fetcher<string[]>(
    'https://raw.githubusercontent.com/Claudemirovsky/worstsource-keys/keys/keys.json',
  );
  const [key1, key2] = response;
  const decodedId = keyPermutation(key1, id);
  const encodedResult = keyPermutation(key2, decodedId);
  const encodedBase64 = btoa(encodedResult);
  return encodedBase64.replace('/', '_');
}

export const filemoonScraper = makeEmbed({
  id: 'filemoon',
  name: 'Filemoon',
  rank: 356,
  async scrape(ctx: EmbedScrapeContext) {
    const id = new URL(ctx.url).pathname.split('/e/')[1];
    const key = await encodeId(ctx, id);
    const data = await getFutoken(ctx, key, ctx.url);

    const subtitleLink: string = new URL(ctx.url).searchParams.get('sub_info') ?? '';
    const subtitles = await ctx.proxiedFetcher<SubtitleRes>(decodeURIComponent(subtitleLink));
    const response = await ctx.proxiedFetcher<StreamRes>(
      `https://vidplay.site/mediainfo/${data}?${ctx.url.split('?')[1]}&autostart=true`,
      {
        headers: {
          Referer: ctx.url,
        },
        query: {
          v: Date.now().toString(),
        },
      },
    );

    const result = response.result;

    if (!result && typeof result !== 'object') {
      throw new Error('video source not found');
    }

    const captions: Caption[] = [];
    subtitles.forEach((track) => {
      const type = getCaptionTypeFromUrl(track.file);

      const language = labelToLanguageCode(track.label);
      if (!type || !language) return;
      captions.push({
        language,
        hasCorsRestrictions: false,
        type,
        url: track.file,
      });
    });

    return {
      stream: {
        type: 'hls',
        playlist: result.sources[0].file,
        flags: [],
        captions,
      },
    };
  },
});
