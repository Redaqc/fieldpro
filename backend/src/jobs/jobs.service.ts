import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantPrismaService } from '../prisma/tenant-prisma.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';

@Injectable()
export class JobsService {
  constructor(private tenantPrisma: TenantPrismaService) {}

  async findAll() {
    return this.tenantPrisma.queryRaw(`
      SELECT * FROM {schema}.jobs
      WHERE is_sample = false
      ORDER BY created_date DESC
    `);
  }

  async findOne(id: string) {
    const job = await this.tenantPrisma.findOne('jobs', id);
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    return job;
  }

  async create(createJobDto: CreateJobDto, userId: string, userEmail: string) {
    const jobNumber = await this.generateJobNumber();
    
    const data = {
      id: this.generateUUID(),
      job_number: jobNumber,
      title: createJobDto.title,
      description: createJobDto.description || '',
      status: createJobDto.status || 'todo',
      priority: createJobDto.priority || 'medium',
      technicians: JSON.stringify(createJobDto.technicians || []),
      labels: JSON.stringify(createJobDto.labels || []),
      checklist: JSON.stringify(createJobDto.checklist || []),
      milestones: JSON.stringify(createJobDto.milestones || []),
      comments: JSON.stringify([]),
      activity_log: JSON.stringify([{
        timestamp: new Date().toISOString(),
        user: userEmail,
        action: 'created',
        details: 'Job created'
      }]),
      customer_id: createJobDto.customer_id,
      customer_name: createJobDto.customer_name,
      due_date: createJobDto.due_date,
      is_overdue: false,
      created_date: new Date(),
      updated_date: new Date(),
      created_by_id: userId,
      created_by: userEmail,
      is_sample: false,
    };

    return this.tenantPrisma.create('jobs', data);
  }

  async update(id: string, updateJobDto: UpdateJobDto, userEmail: string) {
    const job = await this.findOne(id);
    
    const data: any = {};
    Object.keys(updateJobDto).forEach(key => {
      if (updateJobDto[key] !== undefined) {
        if (['technicians', 'labels', 'checklist', 'milestones'].includes(key)) {
          data[key] = JSON.stringify(updateJobDto[key]);
        } else {
          data[key] = updateJobDto[key];
        }
      }
    });

    if (updateJobDto.status && updateJobDto.status !== job.status) {
      const activityLog = job.activity_log || [];
      activityLog.push({
        timestamp: new Date().toISOString(),
        user: userEmail,
        action: 'status_changed',
        details: `Status changed from "${job.status}" to "${updateJobDto.status}"`
      });
      data.activity_log = JSON.stringify(activityLog);
    }

    return this.tenantPrisma.update('jobs', id, data);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.tenantPrisma.delete('jobs', id);
  }

  private async generateJobNumber(): Promise<string> {
    const count = await this.tenantPrisma.queryRaw(`
      SELECT COUNT(*) as count FROM {schema}.jobs
    `);
    const num = (parseInt(count[0].count) + 1).toString().padStart(6, '0');
    return `JOB-${num}`;
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
