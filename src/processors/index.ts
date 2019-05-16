import Github from './github';
import Twitter from './twitter';

export default (remoteUrlString: string) => {
  return {
    Github: Github(remoteUrlString),
    Twitter: Twitter(remoteUrlString)
  };
}