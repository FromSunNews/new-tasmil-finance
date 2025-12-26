import { Module } from "@nestjs/common";
import { StakingQueryService } from "./staking-query.service";
import { StakingOperationsService } from "./staking-operations.service";

@Module({
  providers: [StakingQueryService, StakingOperationsService],
  exports: [StakingQueryService, StakingOperationsService],
})
export class StakingModule {}

