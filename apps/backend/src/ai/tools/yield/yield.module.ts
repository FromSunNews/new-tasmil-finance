import { Module } from "@nestjs/common";
import { YieldQueryService } from "./yield-query.service";

@Module({
  providers: [YieldQueryService],
  exports: [YieldQueryService],
})
export class YieldModule {}
