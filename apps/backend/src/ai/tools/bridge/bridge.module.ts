import { Module } from "@nestjs/common";
import { BridgeOperationsService } from "./bridge-operations.service";

@Module({
  providers: [BridgeOperationsService],
  exports: [BridgeOperationsService],
})
export class BridgeModule {}
