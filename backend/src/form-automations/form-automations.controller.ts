import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { FormAutomationsService } from './form-automations.service';
import { CreateFormAutomationDto } from './dto/create-form-automation.dto';
import { UpdateFormAutomationDto } from './dto/update-form-automation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Form Automations')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('form-automations')
export class FormAutomationsController {
  constructor(private readonly formAutomationsService: FormAutomationsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new form automation' })
  create(@Body() createFormAutomationDto: CreateFormAutomationDto) {
    return this.formAutomationsService.create(createFormAutomationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all form automations' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'formTemplateId', required: false })
  @ApiQuery({ name: 'active', required: false, type: Boolean })
  findAll(@Query('page') page?: string, @Query('limit') limit?: string, @Query('formTemplateId') formTemplateId?: string, @Query('active') active?: string) {
    return this.formAutomationsService.findAll(page ? parseInt(page) : 1, limit ? parseInt(limit) : 20, formTemplateId, active !== undefined ? active === 'true' : undefined);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get form automation by ID' })
  findOne(@Param('id') id: string) {
    return this.formAutomationsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update form automation' })
  update(@Param('id') id: string, @Body() updateFormAutomationDto: UpdateFormAutomationDto) {
    return this.formAutomationsService.update(id, updateFormAutomationDto);
  }

  @Patch(':id/toggle-active')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Toggle form automation active status' })
  toggleActive(@Param('id') id: string) {
    return this.formAutomationsService.toggleActive(id);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete form automation (Admin only)' })
  remove(@Param('id') id: string) {
    return this.formAutomationsService.remove(id);
  }
}
