import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { SupplierInvoicesService } from './supplier-invoices.service';
import { CreateSupplierInvoiceDto } from './dto/create-supplier-invoice.dto';
import { UpdateSupplierInvoiceDto } from './dto/update-supplier-invoice.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Supplier Invoices')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('supplier-invoices')
export class SupplierInvoicesController {
  constructor(
    private readonly supplierInvoicesService: SupplierInvoicesService,
  ) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a new supplier invoice' })
  @ApiResponse({
    status: 201,
    description: 'Supplier invoice created successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid date range or amounts' })
  create(@Body() createSupplierInvoiceDto: CreateSupplierInvoiceDto) {
    return this.supplierInvoicesService.create(createSupplierInvoiceDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all supplier invoices with filters and pagination',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'supplierName', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search in invoice number, supplier name',
  })
  @ApiResponse({ status: 200, description: 'List of supplier invoices' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('supplierName') supplierName?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    return this.supplierInvoicesService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      status,
      supplierName,
      category,
      search,
    );
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get supplier invoice statistics' })
  @ApiQuery({ name: 'supplierName', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiResponse({ status: 200, description: 'Supplier invoice statistics' })
  getStatistics(
    @Query('supplierName') supplierName?: string,
    @Query('category') category?: string,
  ) {
    return this.supplierInvoicesService.getStatistics(supplierName, category);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get supplier invoice by ID' })
  @ApiResponse({ status: 200, description: 'Supplier invoice found' })
  @ApiResponse({ status: 404, description: 'Supplier invoice not found' })
  findOne(@Param('id') id: string) {
    return this.supplierInvoicesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update supplier invoice' })
  @ApiResponse({
    status: 200,
    description: 'Supplier invoice updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Supplier invoice not found' })
  update(
    @Param('id') id: string,
    @Body() updateSupplierInvoiceDto: UpdateSupplierInvoiceDto,
  ) {
    return this.supplierInvoicesService.update(id, updateSupplierInvoiceDto);
  }

  @Patch(':id/payment')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Record payment for supplier invoice' })
  @ApiResponse({ status: 200, description: 'Payment recorded successfully' })
  @ApiResponse({ status: 400, description: 'Payment amount exceeds invoice' })
  recordPayment(
    @Param('id') id: string,
    @Body('paymentAmount') paymentAmount: number,
  ) {
    return this.supplierInvoicesService.recordPayment(id, paymentAmount);
  }

  @Patch(':id/status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update supplier invoice status' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.supplierInvoicesService.updateStatus(id, status);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete supplier invoice (Admin only)' })
  @ApiResponse({ status: 200, description: 'Supplier invoice deleted' })
  @ApiResponse({ status: 404, description: 'Supplier invoice not found' })
  remove(@Param('id') id: string) {
    return this.supplierInvoicesService.remove(id);
  }
}
