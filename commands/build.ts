import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';


export function execute(argv:string[]) {
  if(fs.existsSync('package.json')) {
    spawn('npm', ['run', 'build'], { stdio: 'inherit' });
    return;
  }

  if(process.platform=='linux' && fs.existsSync('build.sh')) {
    spawn('sh', ['build.sh'], { stdio: 'inherit' });
    return;
  }

  if(fs.existsSync('Makefile')) {
    spawn('make', ['build'], { stdio: 'inherit' });
    return;
  }

  if(fs.existsSync('build.bat')) {
    spawn('build.bat', [], { stdio: 'inherit' });
    return;
  }

  if(fs.existsSync('build.cmd')) {
    spawn('build.cmd', [], { stdio: 'inherit' });
    return;
  }

  if(fs.existsSync('build.ps1')) {
    spawn('pwsh', ['-File', 'build.ps1'], { stdio: 'inherit' });
    return;
  }

  if(fs.existsSync('build.js')) {
    require(path.resolve('build.js'));
    return;
  }

  if(fs.existsSync('mkdocs.yml')) {
    spawn('mkdocs', ['build'], { stdio: 'inherit' });
    return;
  }
}
