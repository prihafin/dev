let module_root = process.env['DEV_SYMLINK_MODULE_ROOT'];

if(!module_root) {
  console.error('DEV_SYMLINK_MODULE_ROOT environment variable is not set');
  process.exit(1);
}

import fs from 'fs';
import path from 'path';
import child_process from 'child_process';

let mode = '';
function symlink(root:string, entry:any) {
  let dst = path.join(root, entry);
  if(!fs.existsSync(dst)) return;

  console.log('-', entry);
  child_process.execSync(`npm install ${dst}`);
}

export function execute(argv:string[]) {
  let packages_json = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  if(argv.length > 0) mode = argv[0].trim();

  if(!mode) {
    console.error('Usage: symlink <mode>\n');
    console.error('Available modes:');
    let entries = fs.readdirSync(module_root!);
    for(let entry of entries) {
      console.error('  ', entry);
    }
    process.exit(1);
  }

  let root = path.join(module_root!, mode);
  console.log('[🚧] Symlinking modules to', module_root + path.sep);

  for(let entry of Object.keys(packages_json.dependencies)) {
    symlink(root, entry);
  }
}
