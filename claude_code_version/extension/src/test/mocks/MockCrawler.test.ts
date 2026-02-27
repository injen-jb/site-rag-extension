import { runCrawlerContractTests } from '@/test/contracts/CrawlerContract';
import { MockCrawler } from './MockCrawler';

runCrawlerContractTests(() => {
  const crawler = new MockCrawler();
  crawler.mockResults = [
    {
      url: 'https://example.com',
      title: 'Example',
      markdown: '# Example',
      crawledAt: Date.now(),
    },
  ];
  return crawler;
});
