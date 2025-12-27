import { Module } from "@nestjs/common";
import { ResearchQueryService } from "./research-query.service";
import { ResearchAnalysisService } from "./research-analysis.service";

@Module({
  providers: [ResearchQueryService, ResearchAnalysisService],
  exports: [ResearchQueryService, ResearchAnalysisService],
})
export class ResearchModule {}
