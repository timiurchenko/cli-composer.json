import * as createDebugLogger from 'debug';

import { CustomError } from '../../../../../../errors';
import { lookupLocalRulesBundle } from './lookup-local';

const debugLogger = createDebugLogger('snyk-iac');

export async function initRulesBundle(
  iacCachePath: string,
  userRulesBundlePath: string | undefined,
): Promise<string> {
  debugLogger('Looking for rules bundle locally');
  const rulesBundlePath = await lookupLocalRulesBundle(
    iacCachePath,
    userRulesBundlePath,
  );

  if (!rulesBundlePath) {
    debugLogger(
      `Downloading the rules bundle and saving it at ${iacCachePath}`,
    );
    // Download the rules bundle
  }

  if (rulesBundlePath) {
    return rulesBundlePath;
  } else {
    throw new CustomError(
      'Could not find a valid rules bundle in the configured path',
    );
  }
}
