import { inject } from 'inversify';
import { Command } from '../decorator';
import { executeSelfCmd } from './util';
import { GitSparseCheckoutService } from '../services/GitSparseCheckoutService';
import { GitCloneService, ICloneOptions } from '../services/GitCloneService';
import type { Argv, ArgumentsCamelCase } from 'yargs';
import type { ICommand } from './base';
import type { LogService } from '../services/LogService';

export interface ICloneCommandOptions {
  full?: boolean;
  repository: string;
  directory?: string;
  dryRun?: boolean;
}

@Command()
export class CloneCommand implements ICommand<ICloneCommandOptions> {
  public cmd: string = 'clone <repository> [directory]';
  public description: string = '';

  @inject(GitCloneService) private _gitCloneService!: GitCloneService;
  @inject(GitSparseCheckoutService) private _GitSparseCheckoutService!: GitSparseCheckoutService;

  public builder(yargs: Argv<{}>): void {
    yargs
      .boolean('full')
      .positional('repository', {
        describe: 'The remote repository to clone from.',
        type: 'string'
      })
      .positional('directory', {
        describe:
          'The name of a new directory to clone into. The "humanish" part of the source repository is used if no directory is explicitly given (repo for /path/to/repo.gitService and foo for host.xz:foo/.gitService). Cloning into an existing directory is only allowed if the directory is empty',
        type: 'string'
      })
      .option('dryRun', {
        type: 'boolean',
        hidden: true,
        default: false
      })
      .check((argv) => {
        if (!argv.repository) {
          return 'You must specify a repository to clone.';
        }
        return true;
      });
  }

  public handler = async (
    args: ArgumentsCamelCase<ICloneCommandOptions>,
    logService: LogService
  ): Promise<void> => {
    const { logger } = logService;

    const directory: string = this._gitCloneService.resolveCloneDirectory(args);

    const cloneOptions: ICloneOptions = {
      ...args,
      directory: directory
    };

    if (args.full) {
      this._gitCloneService.fullClone(cloneOptions);
      return;
    }

    this._gitCloneService.bloblessClone(cloneOptions);

    process.chdir(directory);
    await this._GitSparseCheckoutService.checkoutSkeletonAsync();

    logger.info(`Remember to run "cd ${directory}"`);

    // set recommended git config
    executeSelfCmd('auto-config', ['--overwrite']);
  };

  public getHelp(): string {
    return `clone help`;
  }
}
