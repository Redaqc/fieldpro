import { PartialType } from '@nestjs/swagger';
import { CreateSyncLogDto } from './create-sync-log.dto';
export class UpdateSyncLogDto extends PartialType(CreateSyncLogDto) {}
