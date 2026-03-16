import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { db } from './app/db/index';
import { users } from './app/db/schema';

async function main() {
  try {
    console.log('Testing DB connection (with fixed dotenv)...');
    // Note: This might fail if the table doesn't exist yet, which is expected before push
    // But it will confirm if the connection string is valid and client exists.
    const result = await db.select().from(users).limit(1);
    console.log('Connection successful:', result);
  } catch (error: any) {
    if (error.message?.includes('relation "users" does not exist')) {
      console.log('Connection successful, but table "users" does not exist yet (Ready for push!)');
    } else {
      console.error('Connection failed:', error);
    }
  }
}

main();
