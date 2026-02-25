import { app } from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';

async function bootstrap() {
  await connectDB();
  app.listen(env.port, () => {
    console.log(`HMS API running on port ${env.port}`);
  });
}

bootstrap();
