import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CustomFieldService } from './custom-field.service';
import { CreateCustomFieldDto } from './dto/create-custom-field.dto';
import { UpdateCustomFieldDto } from './dto/update-custom-field.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Custom Fields')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('custom-field')
export class CustomFieldController {
  constructor(private readonly service: CustomFieldService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create custom field' })
  create(@Body() dto: CreateCustomFieldDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all custom fields' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'entityType', required: false })
  findAll(@Query('page') page?: string, @Query('limit') limit?: string, @Query('entityType') entityType?: string) {
    return this.service.findAll(page ? parseInt(page) : 1, limit ? parseInt(limit) : 20, entityType);
  }

  @Get('entity/:entityType')
  @ApiOperation({ summary: 'Get custom fields by entity type' })
  findByEntityType(@Param('entityType') entityType: string) {
    return this.service.findByEntityType(entityType);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get custom field by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update custom field' })
  update(@Param('id') id: string, @Body() dto: UpdateCustomFieldDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete custom field' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
