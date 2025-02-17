import * as cloneDeep from 'lodash.clonedeep';
import * as assign from 'lodash.assign';

import {
  IacFileInDirectory,
  IacOutputMeta,
  Options,
  TestOptions,
} from '../../../../lib/types';
import { TestResult } from '../../../../lib/snyk-test/legacy';

import * as utils from '../utils';
import { spinnerMessage } from '../../../../lib/formatters/iac-output';

import { test as iacTest } from './local-execution';
import { formatTestError } from '../format-test-error';

import { assertIaCOptionsFlags } from './local-execution/assert-iac-options-flag';
import { initRules } from './local-execution/rules/rules';
import { cleanLocalCache } from './local-execution/measurable-methods';
import * as ora from 'ora';
import { IaCErrorCodes, IacOrgSettings } from './local-execution/types';
import * as pathLib from 'path';
import { CustomError } from '../../../../lib/errors';
import { OciRegistry } from './local-execution/rules/oci-registry';
import {
  MultipleGroupsResultsProcessor,
  ResultsProcessor,
  SingleGroupResultsProcessor,
} from './local-execution/process-results';
import { getErrorStringCode } from './local-execution/error-utils';

export async function scan(
  iacOrgSettings: IacOrgSettings,
  options: any,
  testSpinner: ora.Ora | undefined,
  paths: string[],
  orgPublicId: string,
  buildOciRules: () => OciRegistry,
  projectRoot?: string,
): Promise<{
  iacOutputMeta: IacOutputMeta | undefined;
  iacScanFailures: IacFileInDirectory[];
  iacIgnoredIssuesCount: number;
  results: any[];
  resultOptions: (Options & TestOptions)[];
}> {
  const results = [] as any[];
  const resultOptions: Array<Options & TestOptions> = [];

  let iacOutputMeta: IacOutputMeta | undefined;
  let iacScanFailures: IacFileInDirectory[] = [];
  let iacIgnoredIssuesCount = 0;

  try {
    const rulesOrigin = await initRules(
      buildOciRules,
      iacOrgSettings,
      options,
      orgPublicId,
    );

    testSpinner?.start(spinnerMessage);

    for (const path of paths) {
      // Create a copy of the options so a specific test can
      // modify them i.e. add `options.file` etc. We'll need
      // these options later.
      const testOpts = cloneDeep(options);
      testOpts.path = path;
      testOpts.projectName = testOpts['project-name'];

      let res: (TestResult | TestResult[]) | Error;
      try {
        assertIaCOptionsFlags(process.argv);

        let resultsProcessor: ResultsProcessor;

        if (projectRoot) {
          if (pathLib.relative(projectRoot, path).includes('..')) {
            throw new CurrentWorkingDirectoryTraversalError();
          }

          resultsProcessor = new SingleGroupResultsProcessor(
            projectRoot,
            orgPublicId,
            iacOrgSettings,
            testOpts,
          );
        } else {
          resultsProcessor = new MultipleGroupsResultsProcessor(
            path,
            orgPublicId,
            iacOrgSettings,
            testOpts,
          );
        }

        const { results, failures, ignoreCount } = await iacTest(
          resultsProcessor,
          path,
          testOpts,
          iacOrgSettings,
          rulesOrigin,
        );
        iacOutputMeta = {
          orgName: results[0]?.org,
          projectName: results[0]?.projectName,
          gitRemoteUrl: results[0]?.meta?.gitRemoteUrl,
        };

        res = results;
        iacScanFailures = [...iacScanFailures, ...(failures || [])];
        iacIgnoredIssuesCount += ignoreCount;
      } catch (error) {
        res = formatTestError(error);
      }

      // Not all test results are arrays in order to be backwards compatible
      // with scripts that use a callback with test. Coerce results/errors to be arrays
      // and add the result options to each to be displayed
      const resArray: any[] = Array.isArray(res) ? res : [res];

      for (let i = 0; i < resArray.length; i++) {
        const pathWithOptionalProjectName = utils.getPathWithOptionalProjectName(
          path,
          resArray[i],
        );
        results.push(
          assign(resArray[i], { path: pathWithOptionalProjectName }),
        );
        // currently testOpts are identical for each test result returned even if it's for multiple projects.
        // we want to return the project names, so will need to be crafty in a way that makes sense.
        if (!testOpts.projectNames) {
          resultOptions.push(testOpts);
        } else {
          resultOptions.push(
            assign(cloneDeep(testOpts), {
              projectName: testOpts.projectNames[i],
            }),
          );
        }
      }
    }
  } finally {
    cleanLocalCache();
  }

  return {
    iacOutputMeta,
    iacScanFailures,
    iacIgnoredIssuesCount,
    results,
    resultOptions,
  };
}

class CurrentWorkingDirectoryTraversalError extends CustomError {
  constructor() {
    super('Path is outside the current working directory');
    this.code = IaCErrorCodes.CurrentWorkingDirectoryTraversalError;
    this.strCode = getErrorStringCode(this.code);
    this.userMessage = `Path is outside the current working directory`;
  }
}
