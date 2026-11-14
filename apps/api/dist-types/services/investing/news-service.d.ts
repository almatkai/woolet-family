export interface NewsItem {
    title: string;
    description: string;
    link: string;
    pubDate: string;
    category: string;
}
export declare class NewsService {
    private FEEDS;
    private USER_AGENT;
    getNewsByCategory(category: keyof typeof this.FEEDS): Promise<NewsItem[]>;
    getNewsForTicker(ticker: string): Promise<NewsItem[]>;
    private parseRss;
    private decodeEntities;
}
export declare const newsService: NewsService;
