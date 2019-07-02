import * as path from 'path';
import * as fs from 'fs';
import { JsonObject } from '../provider/utils/http_utils';
// As we copy the file over manually, we need to hardcode the path
const { relativeToAbsolute } = require('../../dist/lib/provider/utils/file_utils');

// Need to support this call in Protractor:
// const SeleniumConfig = require('webdriver-manager/built/lib/config').Config;
// During the publish phase, we will need to move dist/legacy/config.* to
// to built/lib/config.
export class Config {
  static getSeleniumDir(): string {
    Config.generateUpdateConfig();
    return Config.getDownloadsDirectory();
  }

  /**
   * Gets the downloads directory.
   * Allows the downloads directory to be defined by 'SELENIUM_DIR'
   */
  static getDownloadsDirectory(): string {
    const dir = '__dirname';
    return process.env.SELENIUM_DIR || path.resolve(dir, '..', 'downloads/');
  }

  /**
   * Builds a fake update-config.json to support legacy protractor versions (up to 5.4.2).
   * Some versions of Protractor will call this method in order to pick up the config.
   */
  static getUpdateConfig(): JsonObject {
    const downloads = Config.getDownloadsDirectory();
    const chromedriver = path.resolve(downloads, 'chromedriver.config.json');
    const chromedriverContents = fs.existsSync(chromedriver) && fs.statSync(chromedriver).isFile()
        ? fs.readFileSync(chromedriver).toString() : null;
    const geckodriver = path.resolve(downloads, 'geckodriver.config.json');
    const geckodriverContents = fs.existsSync(geckodriver) && fs.statSync(geckodriver).isFile()
        ? fs.readFileSync(geckodriver).toString() : null;
    const seleniumServer = path.resolve(downloads, 'selenium-server.config.json');
    const seleniumServerContents = fs.existsSync(seleniumServer) && fs.statSync(seleniumServer).isFile()
        ? fs.readFileSync(seleniumServer).toString() : null;
    let updateConfig: JsonObject = {};
    if (chromedriverContents) {
        updateConfig['chrome'] = relativeToAbsolute(downloads, JSON.parse(chromedriverContents));
    }
    if (geckodriverContents) {
        updateConfig['gecko'] = relativeToAbsolute(downloads, JSON.parse(geckodriverContents));
    }
    if (seleniumServerContents) {
        updateConfig['standalone'] = relativeToAbsolute(downloads, JSON.parse(seleniumServerContents));
    }
    return updateConfig;
}

  /**
   * We should create the file update-config.json since webdriver-manager 13+
   * does not. We will only aggregate data from selenium-server.config.json,
   * chromedriver.config.json, and geckodriver.config.json since these are the
   * only APIs that Protractor 5.4.2 needs to run driverProviders/direct
   * (directConnect) and with driverProviders/local.
   */
  static generateUpdateConfig() {
    const downloads = Config.getDownloadsDirectory();
    const updateConfig = this.getUpdateConfig();
    fs.writeFileSync(
      path.resolve(downloads, 'update-config.json'),
      JSON.stringify(updateConfig, null, 2));
  }
}
