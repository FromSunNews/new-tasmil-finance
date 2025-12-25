import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

import { LinksModule } from './links/links.module';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { DocumentModule } from './document/document.module';
import { FilesModule } from './files/files.module';
import { HistoryModule } from './history/history.module';
import { SuggestionsModule } from './suggestions/suggestions.module';
import { VoteModule } from './vote/vote.module';
import { RedisModule } from './infra/redis/redis.module';
import { AgentsModule } from './agents/agents.module';

import { AppService } from './app.service';
import { AppController } from './app.controller';

@Module({
  imports: [
    ThrottlerModule.forRoot(
      (() => {
        const isProd = process.env.NODE_ENV === 'production';
        const configs = [
          { name: 'default', limit: isProd ? 100 : 10000 },
          { name: 'auth', limit: isProd ? 5 : 1000 },
          { name: 'chat', limit: isProd ? 30 : 1000 },
          { name: 'history', limit: isProd ? 100 : 1000 },
        ];
        return configs.map(c => ({ ...c, ttl: 60000 }));
      })(),
    ),
    DatabaseModule,
    RedisModule,
    AuthModule,
    ChatModule,
    DocumentModule,
    FilesModule,
    HistoryModule,
    SuggestionsModule,
    VoteModule,
    LinksModule,
    AgentsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
