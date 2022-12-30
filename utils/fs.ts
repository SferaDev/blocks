import { FsClient } from 'isomorphic-git';

export function readFile(fs: FsClient, path: string) {
  return new Promise<string>((resolve, reject) => {
    // @ts-ignore
    fs.readFile(path, (err, data) => {
      if (err) reject(err);
      else resolve(data.toString());
    });
  });
}
