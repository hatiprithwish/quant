declare module "@cloudflare/puppeteer" {
  interface Page {
    goto(url: string, options?: { waitUntil?: string; timeout?: number }): Promise<void>;
    content(): Promise<string>;
  }
  interface Browser {
    newPage(): Promise<Page>;
    close(): Promise<void>;
  }
  const puppeteer: {
    launch(browser: unknown): Promise<Browser>;
  };
  export default puppeteer;
}
