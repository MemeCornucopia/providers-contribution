import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

import { scrapeIds, searchAndFindMedia } from './util';

async function universalScraper(ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> {
  const goojaraData = await searchAndFindMedia(ctx, ctx.media);
  if (!goojaraData) throw new NotFoundError('Media not found');

  ctx.progress(30);
  const embeds = await scrapeIds(ctx, ctx.media, goojaraData);
  if (embeds?.length === 0) throw new NotFoundError('No embeds found');

  ctx.progress(60);

  return {
    embeds,
  };
}

export const goojaraScraper = makeSourcerer({
  id: 'Goojara',
  name: 'Goojara',
  rank: 225,
  flags: [],
  scrapeShow: universalScraper,
  scrapeMovie: universalScraper,
});
