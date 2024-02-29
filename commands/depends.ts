import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

interface SearchResult {
  found:boolean;
  path:string[];
  entry:NPMEntry;
}

interface NPMEntry {
  version:string;
  overiden:boolean;
  dependencies?:{[key:string]:NPMEntry};
}

function searchPackage(entry:NPMEntry, moduleName:string, modulePath:string[]=[]):SearchResult[] {
  let result:SearchResult[] = [];
  if(entry.dependencies) {
    for(let key in entry.dependencies) {
      let child = entry.dependencies[key];
      if(key === moduleName) {
        result.push({found:true, path: modulePath, entry:child});
      } else {
        let childResult = searchPackage(child, moduleName, [...modulePath, key]);
        if(childResult.length > 0) {
          result.push(...childResult);
        }
      }
    }
  }
  return result;
}

export function execute(argv:string[]) {
  let execArgs = ['npm', 'ls', '--json', '--depth=9999'];
  if(argv.includes('-g')) {
    execArgs.push('-g');
    argv.splice(argv.indexOf('-g'), 1);
  }

  if(argv.length==0) throw new Error('No package name provided');

  // buffer is a bit overkill, but -g can be huge
  exec(execArgs.join(' '), {maxBuffer:100000000}, (error, stdout, stderr) => {
    if(error) throw error;
    let result = <NPMEntry>JSON.parse(stdout);
    let searchResult = searchPackage(result, argv[0]);
    if(searchResult.length == 0) {
      console.log('Package not found');
      return;
    }

    console.log('# Following packages depend on', argv[0], '\n');
    for(let result of searchResult) {
      console.log('-', result.path.join(' -> '));
    }
    console.log();
  });
}
