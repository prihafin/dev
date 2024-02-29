import fs from 'fs';
import path from 'path';
import url from 'url';

import { MongoClient, RunCommandCursor } from 'mongodb';
import { getArgValue } from '../utilities';

const commands = ['watch'];

export async function execute(argv:string[]) {
  let url = getArgValue('--url', argv);
  if(!url) url = 'mongodb://localhost:27017';

  let command = argv[0];

  if(!commands.includes(command)) {
    console.error('Usage: dev mongo <command>');
    console.error('Available commands:', commands.join(', '));
    process.exit(1);
  }

  console.log('Watching for changes in', url, 'database', '"'+argv[1]+'"', 'collection', '"'+argv[2]+'"')

  let client = new MongoClient(url);
  await client.connect();

  let db = client.db(argv[1]);

  if(command=='watch') {
    let collection = argv[2];
    let cursor = db.collection(collection).watch();

    cursor.on('change', (change:any) => {
      console.log('\n' + change);
    });
  }
}
