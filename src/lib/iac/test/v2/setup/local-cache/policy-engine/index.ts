import * as createDebugLogger from 'debug';

import { CustomError } from '../../../../../../errors';
import { lookupLocalPolicyEngine } from './lookup-local';

const debugLogger = createDebugLogger('snyk-iac');

export async function initPolicyEngine(
  iacCachePath: string,
  userPolicyEnginePath: string | undefined,
) {
  debugLogger('Looking for Policy Engine locally');
  const localPolicyEnginePath = await lookupLocalPolicyEngine(
    iacCachePath,
    userPolicyEnginePath,
  );

  if (!localPolicyEnginePath) {
    debugLogger(
      `Downloading the Policy Engine and saving it at ${iacCachePath}`,
    );
    // TODO: Download Policy Engine executable
  }

  if (localPolicyEnginePath) {
    return localPolicyEnginePath;
  } else {
    throw new CustomError(
      'Could not find a valid Policy Engine in the configured path',
    );
  }
}
