import {
  connect,
  Page,
  Browser,
  type LaunchOptions,
  type BrowserConnectOptions,
  type BrowserLaunchArgumentOptions,
  type ElementHandle,
} from "puppeteer";

import puppeteer from "puppeteer";

type ElementBasedBound = {
  selector: string;
  edge: "top" | "bottom" | "left" | "right";
};

type PuppeteerLaunchOptions = LaunchOptions & BrowserLaunchArgumentOptions & BrowserConnectOptions;

interface CaptureOptions {
  [index: string]: string | number | Array<string> | ElementBasedBound | undefined;

  waitFor?: string | Array<string>;
  top: number | ElementBasedBound;
  bottom?: number | ElementBasedBound;
  left: number | ElementBasedBound;
  right?: number | ElementBasedBound;
  cssPath?: string;
}

export async function generateClipBounds(options: ElementHandle, page: Page) {
  return await page.evaluate(options => {
    let bounds = {
      x: 0,
      y: 0,
      width: document.body.clientWidth,
      height: document.body.clientHeight,
    };

    (["top", "left", "bottom", "right"] as const).forEach(edge => {
      const currentOption = (options as any)[edge];
      if (!currentOption) return;

      if (typeof currentOption == "number") {
        if (edge == "top") bounds.y = currentOption;
        if (edge == "left") bounds.x = currentOption;
        if (edge == "bottom") bounds.height = currentOption - bounds.y;
        if (edge == "right") bounds.width = currentOption - bounds.x;
      } else if (typeof currentOption == "object") {
        if (!document.querySelector(currentOption.selector)) throw new Error("Top element not found.");

        const element = document.querySelector(currentOption.selector);
        const boundingClientRect = element.getBoundingClientRect();

        if (edge === "top") bounds.y = boundingClientRect[currentOption.edge];
        if (edge === "left") bounds.x = boundingClientRect[currentOption.edge];
        if (edge === "bottom") bounds.height = boundingClientRect[currentOption.edge] - bounds.y;
        if (edge === "right") bounds.width = boundingClientRect[currentOption.edge] - bounds.x;
      }
    });

    return bounds;
  }, options);
}

export async function createOrConnectChrome(options?: PuppeteerLaunchOptions) {
  const environment = process.env.NODE_ENV;

  // Use WS in Production - Defer to a docker container
  // This reduces production bundle size, and should be faster
  if (environment === "production") {
    return await connect({ browserWSEndpoint: "ws://chrome:9090" });
  }

  return await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    ...options,
  });
}

async function createPage(url: string, options?: PuppeteerLaunchOptions) {
  const browser = await createOrConnectChrome(options);

  const page = await browser.newPage();
  await page.goto(url);

  return { page, browser };
}

export async function closeBrowser(browser: Browser) {
  await Promise.all((await browser.pages()).map(async page => await page.close()));

  await browser.close();
}

export async function capturePage(url: string, options: CaptureOptions = { left: 0, top: 0 }): Promise<Buffer> {
  const { page, browser } = await createPage(url);

  if (options.cssPath) await page.addStyleTag({ path: options.cssPath });

  if (options.waitFor) {
    if (Array.isArray(options.waitFor)) {
      await Promise.all(options.waitFor.map(selector => page.waitForSelector(selector)));
    } else {
      await page.waitForSelector(options.waitFor);
    }
  }

  const clip = await generateClipBounds(options as any, page);

  const screenshotBuffer = await page.screenshot({
    clip,
  });

  await closeBrowser(browser);

  return screenshotBuffer as Buffer;
}

export async function captureSelector(url: string, selector: string, options?: PuppeteerLaunchOptions) {
  const { page, browser } = await createPage(url, options);

  await page.goto(url);

  const element = await page.waitForSelector(selector);

  const screenshot = await element!.screenshot();

  await closeBrowser(browser);

  return screenshot;
}
