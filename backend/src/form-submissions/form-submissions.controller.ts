import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { FormSubmissionsService } from './form-submissions.service';
import { CreateFormSubmissionDto } from './dto/create-form-submission.dto';
import { UpdateFormSubmissionDto } from './dto/update-form-submission.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Form Submissions')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('form-submissions')
export class FormSubmissionsController {
  constructor(private readonly formSubmissionsService: FormSubmissionsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Submit a form' })
  @ApiResponse({ status: 201, description: 'Form submitted successfully' })
  create(@Body() createFormSubmissionDto: CreateFormSubmissionDto) {
    return this.formSubmissionsService.create(createFormSubmissionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all form submissions' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'formTemplateId', required: false })
  @ApiQuery({ name: 'submittedBy', required: false })
  @ApiQuery({ name: 'jobId', required: false })
  findAll(@Query('page') page?: string, @Query('limit') limit?: string, @Query('formTemplateId') formTemplateId?: string, @Query('submittedBy') submittedBy?: string, @Query('jobId') jobId?: string) {
    return this.formSubmissionsService.findAll(page ? parseInt(page) : 1, limit ? parseInt(limit) : 20, formTemplateId, submittedBy, jobId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get form submission by ID' })
  findOne(@Param('id') id: string) {
    return this.formSubmissionsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update form submission' })
  update(@Param('id') id: string, @Body() updateFormSubmissionDto: UpdateFormSubmissionDto) {
    return this.formSubmissionsService.update(id, updateFormSubmissionDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete form submission (Admin only)' })
  remove(@Param('id') id: string) {
    return this.formSubmissionsService.remove(id);
  }
}
