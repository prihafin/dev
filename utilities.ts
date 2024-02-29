export function showSpinner(slowCall:Function): Promise<any> {
  return new Promise((resolve, reject) => {
    let spinner = ['|', '/', '-', '\\'];
    let i = 0;
    let interval = setInterval(() => {
      console.log('i', i);
      process.stdout.write(`\r${spinner[i]} Working...`);
      i = (i + 1) % spinner.length;
    }, 100);

    let result = slowCall();
    clearInterval(interval);

    process.stdout.write('\r');
    resolve(result);
  });
}

export function getArgValue(argname:string, argv:string[]):string|undefined {
  let idx = process.argv.indexOf(argname);
  if(idx < 0) return;
  let res = process.argv[idx+1];
  delete process.argv[idx];
  delete process.argv[idx+1];
  return res;
}