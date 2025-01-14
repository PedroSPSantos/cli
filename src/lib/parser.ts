import { optionList, reports, modules } from './options';
import { readJsonFile } from './fileUtils';
import { printHelp, printError } from './parserUtils';
import parseACT from './actParser';
import parseWCAG from './wcagParser';
import parseBP from './bpParser';

import commandLineArgs, { CommandLineOptions } from 'command-line-args';
import { QualwebOptions } from '@qualweb/core';
import setValue from 'set-value';

async function parse(): Promise<QualwebOptions> {
  let mainOptions = commandLineArgs(optionList, { stopAtFirstUnknown: true });
  const options: QualwebOptions = {};

  if (mainOptions._unknown) {
    printHelp();
  }

  if (mainOptions.json) {
    mainOptions = <CommandLineOptions>await readJsonFile(mainOptions['json']);
  }

  if (mainOptions.url) {
    options.url = mainOptions.url;
  }

  if (mainOptions.file) {
    options.file = mainOptions.file;
  }

  if (mainOptions.crawl) {
    options.crawl = mainOptions.crawl;
  }

  if (mainOptions.module) {
    options.execute = {};
    const modulesToExecute = mainOptions.module;

    for (const module of modulesToExecute || []) {
      if (!modules.includes(module.replace(',', '').trim())) {
        printError('Module ' + module.replace(',', '').trim() + ' does not exist.');
      } else {
        const mod = module.replace(',', '').trim();
        switch (mod) {
          case 'act':
            options.execute.act = true;
            break;
          case 'html':
            options.execute.wcag = true;
            break;
          case 'bp':
            options.execute.bp = true;
            break;
          case 'wappalyzer':
            options.execute.wappalyzer = true;
            break;
          case 'counter':
            options.execute.counter = true;
            break;
          default:
            printError('Module ' + mod + ' does not exist.');
            break;
        }
      }
    }
  }

  if (mainOptions.viewport) {
    options.viewport = {
      mobile: false,
      landscape: true,
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:22.0) Gecko/20100101 Firefox/22.0', default value for mobile = 'Mozilla/5.0 (Linux; U; Android 2.2; en-us; DROID2 GLOBAL Build/S273) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1",
      resolution: {
        width: 1920,
        height: 1080
      }
    };

    if (mainOptions.mobile) {
      options.viewport.mobile = mainOptions.mobile;
    }

    if (mainOptions.orientation) {
      options.viewport.landscape = mainOptions.orientation !== 'portrait';
    }

    if (mainOptions['user-agent']) {
      options.viewport.userAgent = mainOptions['user-agent'];
    }

    if (mainOptions.width) {
      setValue(options, 'viewport.resolution.width', mainOptions.width);
    }

    if (mainOptions.height) {
      setValue(options, 'viewport.resolution.height', mainOptions.height);
    }
  }

  if (mainOptions.maxParallelEvaluations) {
    options.maxParallelEvaluations = mainOptions.maxParallelEvaluations;
  }

  const reportType = 'report-type';

  if (mainOptions[reportType]) {
    options['r'] = mainOptions[reportType];

    if (!reports.includes(mainOptions[reportType])) {
      printError('Wrong report type selected.');
    }
  }

  //////////////////////////////////////////////////////////////////////////////////
  // ACT ///////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////////

  await parseACT(mainOptions, options);

  //////////////////////////////////////////////////////////////////////////////////
  // WCAG //////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////////

  await parseWCAG(mainOptions, options);

  //////////////////////////////////////////////////////////////////////////////////
  // BP ////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////////

  await parseBP(mainOptions, options);

  //////////////////////////////////////////////////////////////////////////////////
  // HELP //////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////////

  if (mainOptions.help) {
    printHelp();
  }

  return options;
}

export = parse;
