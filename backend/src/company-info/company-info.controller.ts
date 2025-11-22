import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CompanyInfoService } from './company-info.service';
import { CreateCompanyInfoDto } from './dto/create-company-info.dto';
import { UpdateCompanyInfoDto } from './dto/update-company-info.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Company Info')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('company-info')
export class CompanyInfoController {
  constructor(private readonly service: CompanyInfoService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create company info' })
  create(@Body() dto: CreateCompanyInfoDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all company info' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.service.findAll(page ? parseInt(page) : 1, limit ? parseInt(limit) : 20);
  }

  @Get('current')
  @ApiOperation({ summary: 'Get current company info' })
  getCurrent() {
    return this.service.getCurrent();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get company info by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update company info' })
  update(@Param('id') id: string, @Body() dto: UpdateCompanyInfoDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete company info' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
