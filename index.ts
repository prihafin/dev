#!/usr/bin/env node


const fs = require('fs');
const path = require('path');
const optionatorModule = require('optionator');

import { ICommandlineOptions, parseCommandline } from './cmdline-options';

const packageJson = require('../package.json');

const argvCommands = process.argv.slice(2);
const cmdPath = path.join(__dirname, '..', 'commands');

const argvOptions = {
  prepend: 'Usage: dev <command>',
  append: 'Version ' + packageJson.version,
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

const optionator = optionatorModule(argvOptions);
const options = optionator.parseArgv(process.argv);

function help() {
  console.error('Usage: dev <command>\n');
  console.error('Available commands:');
  let entries = fs.readdirSync(cmdPath);
  for(let entry of entries) {
    if(!entry.endsWith('.js')) continue;
    console.error('  ', entry.slice(0, -3));
  }
}

exports.execute_command = async function(command:any, argv:any) {
  let node_module_path = path.join(cmdPath, command + '.js');
  if(!fs.existsSync(node_module_path)) {
    console.error('Unknown command:', command, '\n');
    help();
    process.exit(1);
  }
  let node_module = require(node_module_path);
  await node_module.execute(argv);
}

exports.execute = async function() {
  if(argvCommands.length < 1 || options.help) {
    help();
    process.exit(1);
  }

  await exports.execute_command(argvCommands[0], argvCommands.slice(1));
}

exports.execute();
