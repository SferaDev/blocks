export type FS = {
  readFileSync: (path: string, encoding: string) => string;
  writeFileSync: (path: string, data: string, encoding: string) => void;
  existsSync: (path: string) => boolean;
  mkdirSync: (path: string) => void;
  readdirSync: (path: string) => string[];
};
