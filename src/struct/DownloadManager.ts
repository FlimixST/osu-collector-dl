import { createWriteStream, existsSync, mkdirSync } from "fs";
import axios from "axios";
import { resolve } from "path";
import { AxiosResponse } from "axios";
import { Readable } from "stream";
import { config } from "../../config";

export class DownloadManager {
  public path: string;
  public parallel: boolean;

  constructor(path?: string, parallel?: boolean) {
    this.path = path ?? resolve(__dirname, "../../../downloads");
    this.parallel = parallel ?? false;
  }

  public async bulk_download(urls: string[]) {
    /**
     * Check If Directory Exist
     */
    this.checkDir();

    /**
     * Performs Downloads
     */
    if (this.parallel) {
      /**
       * Impulsive Download if Urls are Too Many
       */
      urls.length > 10
        ? this.impulse(urls, config.dl_impulse_rate)
        : await Promise.all(urls.map((url) => this._dl(url)));
    } else {
      /**
       * Download Sequentially
       */
      for (let i = 0; i < urls.length; i++) await this._dl(urls[i]);
    }
  }

  private async _dl(url: string) {
    /**
     * GET Download Stream
     */
    console.log("Requesting: " + url);
    const res = await axios
      .get(url, { responseType: "stream" })
      .catch(() => null);

    if (!res) return null;

    /**
     * Create Stream and Pipe
     */
    const filename = this.getFilename(res);
    const file = createWriteStream(this.path + "/" + filename);

    await new Promise<void>((resolve, reject) => {
      console.log("Downloading: " + filename);
      res.data.pipe(file);
      file.on("close", () => {
        console.log("Downloaded: " + filename);
        resolve();
      });
      file.on("error", reject);
    });
  }

  private getFilename(response: AxiosResponse<Readable>): string {
    const headerNames = Object.keys(response.headers);
    const headerIndex = headerNames
      .map((h) => h.toLowerCase())
      .indexOf("content-disposition");
    const contentDispositionHeader = response.headers[
      headerNames[headerIndex]
    ] as string;
    const regexFilename = /filename="(.+)"/g;
    const regexResult = regexFilename.exec(contentDispositionHeader);

    /**
     * Regex To Prevent Forbidden Directory Names
     */
    const regex = /( |\/|<|>|:|"|\\|\||\?|\*)+/g;

    return regexResult
      ? decodeURIComponent(regexResult[1].replace(regex, ""))
      : "Untitled.osz";
  }
  /**
   * Check If Directory Exist
   */
  private checkDir(): void {
    if (!existsSync(this.path)) {
      mkdirSync(this.path);
    }
    return;
  }

  private async impulse(ids: string[], rate: number): Promise<any[]> {
    const downloaded: any[] = [];

    const perLen = ids.length / rate;

    for (let i = 0; i < perLen; i++) {
      const promises: Promise<any>[] = [];
      /**
       * Bursting Rate
       */
      const start = i * rate;
      const end = (i + 1) * rate;
      const inRange = ids.slice(start, end);
      const p = inRange.map((id) => this._dl(id));
      promises.push(...p);

      /**
       * Resolve Promises
       */
      downloaded.push([...(await Promise.all(promises))]);
    }
    return downloaded;
  }
}
