import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Documents')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly service: DocumentsService) {}
  @Post() @ApiOperation({ summary: 'Upload document' })
  create(@Body() dto: CreateDocumentDto) { return this.service.create(dto); }
  @Get() @ApiOperation({ summary: 'Get all documents' }) @ApiQuery({ name: 'page', required: false }) @ApiQuery({ name: 'limit', required: false }) @ApiQuery({ name: 'uploadedBy', required: false }) @ApiQuery({ name: 'entityType', required: false }) @ApiQuery({ name: 'entityId', required: false }) @ApiQuery({ name: 'category', required: false })
  findAll(@Query('page') page?: string, @Query('limit') limit?: string, @Query('uploadedBy') uploadedBy?: string, @Query('entityType') entityType?: string, @Query('entityId') entityId?: string, @Query('category') category?: string) {
    return this.service.findAll(page ? parseInt(page) : 1, limit ? parseInt(limit) : 20, uploadedBy, entityType, entityId, category);
  }
  @Get(':id') @ApiOperation({ summary: 'Get document by ID' })
  findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Patch(':id') @ApiOperation({ summary: 'Update document' })
  update(@Param('id') id: string, @Body() dto: UpdateDocumentDto) { return this.service.update(id, dto); }
  @Delete(':id') @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN) @ApiOperation({ summary: 'Delete document' })
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
