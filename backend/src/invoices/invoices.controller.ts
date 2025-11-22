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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { PaymentDetailsDto } from './dto/payment-details.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { TenantThrottlerGuard } from '../common/guards/tenant-throttler.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';

@ApiTags('invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, TenantThrottlerGuard)
@Throttle({ default: { ttl: 60000, limit: 100 } }) // ✅ Added rate limiting: 100 requests per minute per tenant
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new invoice' })
  create(
    @CurrentTenant() tenantId: string,
    @Body() createDto: CreateInvoiceDto,
  ) {
    return this.invoicesService.create(tenantId, createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all invoices' })
  findAll(@CurrentTenant() tenantId: string, @Query() filters: any) {
    return this.invoicesService.findAll(tenantId, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an invoice by ID' })
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.invoicesService.findOne(tenantId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an invoice' })
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() updateDto: UpdateInvoiceDto,
  ) {
    return this.invoicesService.update(tenantId, id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an invoice' })
  delete(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.invoicesService.delete(tenantId, id);
  }

  @Post(':id/send')
  @ApiOperation({ summary: 'Send invoice to customer' })
  send(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.invoicesService.send(tenantId, id);
  }

  @Post(':id/mark-paid')
  @ApiOperation({ summary: 'Mark invoice as paid' })
  markAsPaid(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() paymentDetails: PaymentDetailsDto,
  ) {
    return this.invoicesService.markAsPaid(tenantId, id, paymentDetails);
  }
}
