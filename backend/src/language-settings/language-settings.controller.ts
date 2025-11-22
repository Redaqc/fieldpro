import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { LanguageSettingsService } from './language-settings.service';
import { CreateLanguageSettingsDto } from './dto/create-language-settings.dto';
import { UpdateLanguageSettingsDto } from './dto/update-language-settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Language Settings')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('language-settings')
export class LanguageSettingsController {
  constructor(private readonly service: LanguageSettingsService) {}

  @Post()
  @ApiOperation({ summary: 'Create language settings' })
  create(@Body() dto: CreateLanguageSettingsDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all language settings' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.service.findAll(page ? parseInt(page) : 1, limit ? parseInt(limit) : 20);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get language settings by user ID' })
  findByUserId(@Param('userId') userId: string) {
    return this.service.findByUserId(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get language settings by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update language settings' })
  update(@Param('id') id: string, @Body() dto: UpdateLanguageSettingsDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete language settings' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
