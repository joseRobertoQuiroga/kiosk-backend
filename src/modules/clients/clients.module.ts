// src/modules/clients/clients.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsController, BranchesController } from './clients.controller';
import { ClientsService } from './clients.service';
import { BranchesService } from './branches.service';
import { Client } from './entities/client.entity';
import { Branch } from './entities/branch.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Client, Branch]),
  ],
  controllers: [ClientsController, BranchesController],
  providers: [ClientsService, BranchesService],
  exports: [ClientsService, BranchesService],
})
export class ClientsModule {}