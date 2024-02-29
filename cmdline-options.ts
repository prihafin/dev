const symFound = Symbol('found');

let errorPrefix = 'ERROR';
if(process.stderr.isTTY) errorPrefix = '\x1b[31m' + errorPrefix + '\x1b[0m';

export interface ICommandlineOption<T> {
  name: T;
  alias?: T;
  description?: string;
  mandatory?: boolean;
  type: 'string' | 'number' | 'boolean' | 'array';
}

export interface ICommandlineOptions<T> {
  /** Shown after "Usage:" in help */
  prefix?: string;
  /** If `true` an error is thrown when not all options are consumed */
  final?: boolean;
  /** if `true` errors in parsing will cause `process.exit()` */
  exit?: boolean;
  /** List of options to parse */
  options: ICommandlineOption<T>[];
}

export interface ICommandlineResults<T extends string> {
  /** Set to the error message if errors were detected in parsing */
  error?: string;
  /** Parsed options */
  options: Record<T, any>;
  /** Remaining options after parsing */
  argv: string[];
}

interface IInternalCommandlineOption<T> extends ICommandlineOption<T> {
  [symFound]?: boolean;
}

interface IInternalCommandlineOptions<T> {
  options: IInternalCommandlineOption<T>[];
}

class CommandlineOptionError<T extends string> extends Error {
  constructor(message:string, public result: ICommandlineResults<T>) {
    super(message);
  }
}

function indexOfOption<T>(argv:string[], option:ICommandlineOption<T>): number {
  for(var i=0; i<argv.length; i++) {
    if(!argv[i].startsWith('-')) return -1;
    if(argv[i]===`--${option.name}`) return i;
    if(option.alias && argv[i]===`-${option.alias}`) return i;
  }
  return -1;
}

function indent(prefix:string, description:string|undefined, indent:number) {
  if(!description) return prefix;
  description = description.replace(/\n/g, '\n' + ' '.repeat(indent));
  let needed = indent - prefix.length;
  if(needed<0) {
    needed = indent;
    prefix += '\n';
  }
  return prefix + ' '.repeat(needed) + description;
}

function getUsage(option: ICommandlineOption<string>) {
  let desc = option.alias ? '   -'+option.alias + ', ' : '       ';

  if(option.type==='boolean') {
    desc += `--${option.name}`;
  } else if(option.type==='array') {
    desc += `--${option.name} <string,string,...>`;
  } else {
    desc += `--${option.name} <${option.type}>`;
  }

  return indent(desc, option.description, 40);
}

function getUsages(options: ICommandlineOptions<string>) {
  let desc = 'Usage: ' + options.prefix + '\n';

  desc += '\n Mandatory options:\n';
  let optCount = 0;
  for(let option of options.options) {
    if(option.mandatory!==true) continue;
    desc += getUsage(option) + '\n';
    optCount++;
  }

  if(optCount===0) desc += '   (none)\n';

  optCount = 0;
  desc += '\n Optional options:\n';
  for(let option of options.options) {
    if(option.mandatory===true) continue;
    desc += getUsage(option) + '\n';
    optCount++;
  }
  if(optCount===0) desc += '   (none)\n';

  return desc + '\n';
}

function _parseCommandline<T extends string>(argv: string[], options: ICommandlineOptions<T>): ICommandlineResults<T> {
  let result: ICommandlineResults<T> = {options:<Record<T,any>>{}, argv:[]};
  let internalOptions = <IInternalCommandlineOptions<T>>options;
  let useBuiltinHelp = !options.options.some(o => o.name==='help');

  if(useBuiltinHelp) {
    internalOptions.options.push(<ICommandlineOption<T>>{
      name: 'help',
      description: 'Show this help',
      type: 'boolean',
    });
  }

  argv = argv.slice();

  while(true) {
    var done = true;

    for(let option of internalOptions.options) {
      if(option[symFound]) continue;

      let idx = indexOfOption(argv, option);
      if(idx==-1) continue;

      if(useBuiltinHelp && option.name=='help') {
        console.log(getUsages(<IInternalCommandlineOptions<string>>options));
        process.exit();
      }

      var done = false;

      option[symFound] = true;

      if(option.type==='boolean') {
        result.options[option.name] = true;
        argv.splice(idx, 1);
        break;
      }

      if(option.type==='number') {
        let tmp = argv.splice(idx, 2);
        result.options[option.name] = parseFloat(tmp[1]);
        if(isNaN(result.options[option.name])) throw new CommandlineOptionError(`Option "${option.name}" should be a number`, result);
        break;
      }

      if(option.type==='array') {
        let tmp = argv.splice(idx, 2);
        result.options[option.name] = tmp[1].split(',');
        for(let i=0; i<result.options[option.name].length; i++) {
          let v = parseFloat(result.options[option.name][i]);
          if(!isNaN(v)) result.options[option.name][i] = v;
        }
        break;
      }


      let tmp = argv.splice(idx, 2);
      result.options[option.name] = tmp[1];
    }

    if(done) break;
  }

  for(let option of internalOptions.options) {
    if(option[symFound]) continue;
    if(option.mandatory===true) throw new CommandlineOptionError(`Missing mandatory option "--${option.name}"`, result);
  }

  result.argv = argv;

  if(argv.length>0 && argv[0].startsWith('--')) throw new CommandlineOptionError(`Unknown option "${argv[0]}"`, result);

  if(options.final && argv.length>0) {
    throw new CommandlineOptionError(`Unparsed options remain "${argv.join(' ')}"`, result);
  }

  return result;
};

export function parseCommandline<T extends string>(argv: string[], options: ICommandlineOptions<T>): ICommandlineResults<T>;
export function parseCommandline(argv: string[], options: any): ICommandlineResults<string>;
export function parseCommandline<T extends string>(argv: string[], options: ICommandlineOptions<T>): ICommandlineResults<T> {
  try {
    return _parseCommandline(argv, options);
  } catch(err:any) {
    err.result.error = err.message;
    console.error('['+errorPrefix+']', err.message, '\n');
    console.log(getUsages(<IInternalCommandlineOptions<string>>options));
    if(options.exit) process.exit();
    return err.result;
  }
}

//const args = ['test-command', '--arg1', 'value'];
const args = ['-aas', 'arvo!', '--test', '123,argh,3,5'];

var resultObj = parseCommandline(args, {
  prefix: 'test-command [options] verb',
  options:[
    {
      name: 'arg1',
      alias: 'a',
      mandatory: true,
      description: 'This is a mandatory option arg1\nrawr wheee, this needs indent too',
      type: 'string',
    },
    {
      name: 'test',
      description: 'Optional option',
    },
    {
      name: 'yea',
      description: 'Another optional option',
      type: 'boolean',
    },
  ]
});

console.log('result', resultObj);
