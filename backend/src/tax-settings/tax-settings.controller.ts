import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { TaxSettingsService } from './tax-settings.service';
import { CreateTaxSettingsDto } from './dto/create-tax-settings.dto';
import { UpdateTaxSettingsDto } from './dto/update-tax-settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Tax Settings')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tax-settings')
export class TaxSettingsController {
  constructor(private readonly service: TaxSettingsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create tax settings' })
  create(@Body() dto: CreateTaxSettingsDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tax settings' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'active', required: false })
  @ApiQuery({ name: 'province', required: false })
  @ApiQuery({ name: 'country', required: false })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('active') active?: string,
    @Query('province') province?: string,
    @Query('country') country?: string,
  ) {
    return this.service.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      active === 'true' ? true : active === 'false' ? false : undefined,
      province,
      country,
    );
  }

  @Get('active')
  @ApiOperation({ summary: 'Get all active tax settings' })
  findActive() {
    return this.service.findActive();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tax settings by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update tax settings' })
  update(@Param('id') id: string, @Body() dto: UpdateTaxSettingsDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete tax settings' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
