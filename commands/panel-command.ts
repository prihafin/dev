
import fs from 'fs';
import path from 'path';
import redis from 'redis';

const optionatorModule = require('optionator');

const optionatorOptions = {
  prepend: 'Usage: dev panel-command <command>',
  append: 'Version 1.0.0',
  options: [
    {
      option: 'help',
      alias: 'h',
      type: 'Boolean',
      description: 'Displays help'
    },
    {
      option: 'global',
      alias: 'g',
      type: 'Boolean',
      description: 'Use global configuration'
    }
  ]
};

export function execute(argv:string[]) {
  const optionator = optionatorModule(optionatorOptions);
  const options = optionator.parseArgv(argv);
  console.log(argv, options)
}
