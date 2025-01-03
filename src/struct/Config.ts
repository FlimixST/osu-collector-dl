import { existsSync, writeFileSync } from "fs";
import path from "path";
import Logger from "../core/Logger";
import type { Json, JsonValues, WorkingMode } from "../types";
import Util from "../util";
import OcdlError from "./OcdlError";

export default class Config {
  // osu Mirror api url
  osuMirrorApiUrl: string;
  // osu Mirror alt api url
  osuMirrorAltApiUrl: string;
  // Whether the download process should be done in parallel
  parallel: boolean;
  // The number of URLs that should be downloaded in parallel at once
  concurrency: number;
  // The number of URLs that can be at most downladed within the interval
  intervalCap: number;
  // The interval that limits the interval cap
  interval: number;
  // The directory to save beatmaps
  directory: string;
  // The mode of operation
  // 1: Download BeatmapSet
  // 2: Download BeatmapSet + Generate .osdb
  // 3: Generate .osdb
  mode: WorkingMode;
  // The length of the log when downloading beatmapsets
  logSize: number;
  // The path to the config file
  static readonly configFilePath = "./config.json";
  songsDirectory: string;
  checkExistingSongs: boolean;

  // Constructs a new Config object from a string of JSON data
  // If no data is provided, default values are used
  constructor(contents?: string) {
    let config: Json = {};
    if (contents) {
      try {
        // Parse the JSON data and store it in the 'config' object
        config = JSON.parse(contents) as Json;
      } catch (e) {
        // If there is an error parsing the JSON data, throw an OcdlError
        throw Logger.generateErrorLog(new OcdlError("INVALID_CONFIG", e));
      }
    }

    // Set default values for properties if not provided in 'config' object
    this.osuMirrorApiUrl = typeof config.osuMirrorApiUrl === "string" ? config.osuMirrorApiUrl : "";
    this.osuMirrorAltApiUrl = typeof config.osuMirrorAltApiUrl === "string" ? config.osuMirrorAltApiUrl : "";
    this.logSize = !isNaN(Number(config.logSize)) ? Number(config.logSize) : 15;
    this.parallel = Util.isBoolean(config.parallel)
      ? (config.parallel as boolean)
      : true;
    this.concurrency = !isNaN(Number(config.concurrency))
      ? Number(config.concurrency)
      : 3;
    if (this.concurrency > 10) {
      this.concurrency = 10;
    }
    this.intervalCap = !isNaN(Number(config.intervalCap))
      ? Number(config.intervalCap)
      : 50;
    this.interval = !isNaN(Number(config.interval))
      ? Number(config.interval)
      : 60;
    this.directory = this._getPath(config.directory);
    this.mode = this._getMode(config.mode);
    this.songsDirectory = typeof config.songsDirectory === "string" ? config.songsDirectory : "";
    this.checkExistingSongs = typeof config.checkExistingSongs === "boolean" ? config.checkExistingSongs : true;
  }

  // Generates a default config file if one does not already exist
  static generateConfig(): Config {
    if (!Config._checkIfConfigFileExist()) {
      writeFileSync(
        Config.configFilePath,
        JSON.stringify({
          osuMirrorApiUrl: "https://mirror.flimixst.dev/d/",
          osuMirrorAltApiUrl: "https://osu.direct/api/d/",
          parallel: true,
          concurrency: 5,
          intervalCap: 50,
          interval: 60,
          logSize: 15,
          directory: "",
          mode: 1,
          songsDirectory: "",
          checkExistingSongs: true
        })
      );
    }
    return new Config();
  }

  // Check if the config file exists
  private static _checkIfConfigFileExist(): boolean {
    return existsSync(Config.configFilePath);
  }

  // Returns the mode of operation based on the provided data
  // If the provided data is invalid, returns 1 (Download BeatmapSet)
  private _getMode(data: JsonValues): 1 | 2 | 3 {
    return data == 1 ? 1 : data == 2 ? 2 : data == 3 ? 3 : 1;
  }

  // Returns the directory path based on the provided data
  // If the provided data is invalid, returns the current working directory
  private _getPath(data: JsonValues): string {
    if (typeof data !== "string") return process.cwd();
    return path.isAbsolute(data) ? data : process.cwd();
  }
}
