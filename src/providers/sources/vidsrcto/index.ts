import { flags } from '@/main/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { vidplayScraper } from '@/providers/embeds/vidplay';
import {
  getVidSrcToSourceDetails,
  getVidSrcToSources,
  getVidSrcToSourcesId,
} from '@/providers/sources/vidsrcto/scrape';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

import { vidSrcToBase } from './common';

const universalScraper = async (ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> => {
  const sourcesId = await getVidSrcToSourcesId(ctx);

  const sources = await getVidSrcToSources(ctx, sourcesId);

  const embeds = [];

  for (const source of sources.result) {
    if (source.title === 'Vidplay' || source.title === 'Filemoon') {
      embeds.push({
        embedId: source.title.toLowerCase(),
        url: await getVidSrcToSourceDetails(ctx, source.id),
      });
    }
  }

  return {
    embeds,
  };
};

export const vidsrctoScraper = makeSourcerer({
  id: 'vidsrcto',
  name: 'VidSrcTo',
  rank: 355,
  flags: [flags.NO_CORS],
  scrapeMovie: universalScraper,
  scrapeShow: universalScraper,
});
