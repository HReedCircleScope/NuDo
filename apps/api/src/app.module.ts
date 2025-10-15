import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserSchema, ZoneSchema, SessionSchema } from './schemas';

@Module({
  imports: [
    // Load .env so NUDO_MONGO_URI is available
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),

    // Connect to MongoDB Atlas
    MongooseModule.forRoot(process.env.NUDO_MONGO_URI as string),

    // Register our collections
    MongooseModule.forFeature([
      { name: 'User', schema: UserSchema },
      { name: 'Zone', schema: ZoneSchema },
      { name: 'Session', schema: SessionSchema },
    ]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}