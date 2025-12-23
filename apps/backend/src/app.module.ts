import { Module } from '@nestjs/common';

import { LinksModule } from './links/links.module';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { DocumentModule } from './document/document.module';
import { FilesModule } from './files/files.module';
import { HistoryModule } from './history/history.module';
import { SuggestionsModule } from './suggestions/suggestions.module';
import { VoteModule } from './vote/vote.module';

import { AppService } from './app.service';
import { AppController } from './app.controller';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    ChatModule,
    DocumentModule,
    FilesModule,
    HistoryModule,
    SuggestionsModule,
    VoteModule,
    LinksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
