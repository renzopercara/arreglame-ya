
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkerSpecialtyInput, UpdateWorkerSpecialtyInput, ServiceSelectionInput } from './dto/worker-specialty.input';

@Injectable()
export class WorkerService {
  constructor(private prisma: PrismaService) {}

  async updateLocation(userId: string, lat: number, lng: number) {
    // Actualizamos las columnas planas para acceso rápido Y la columna geometry para búsquedas espaciales
    // ST_SetSRID(ST_MakePoint(lng, lat), 4326) crea un punto geográfico estándar (WGS 84)
    
    await (this.prisma as any).$executeRaw`
      UPDATE "WorkerProfile"
      SET 
        latitude = ${lat},
        longitude = ${lng},
        location = ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326),
        "lastLocationUpdate" = NOW()
      WHERE "userId" = ${userId}
    `;

    return true;
  }

  async setStatus(userId: string, status: string) {
    return (this.prisma as any).workerProfile.update({
        where: { userId },
        data: { status }
    });
  }

  // ============================================
  // WORKER SPECIALTY MANAGEMENT
  // ============================================

  async addSpecialty(workerId: string, input: CreateWorkerSpecialtyInput) {
    // Check if worker exists
    const worker = await this.prisma.workerProfile.findUnique({
      where: { id: workerId },
    });

    if (!worker) {
      throw new NotFoundException('Worker profile not found');
    }

    // Check if category exists
    const category = await (this.prisma as any).serviceCategory.findUnique({
      where: { id: input.categoryId },
    });

    if (!category) {
      throw new NotFoundException('Service category not found');
    }

    // Check if specialty already exists
    const existingSpecialty = await (this.prisma as any).workerSpecialty.findUnique({
      where: {
        workerId_categoryId: {
          workerId,
          categoryId: input.categoryId,
        },
      },
    });

    if (existingSpecialty) {
      throw new BadRequestException('Worker already has this specialty');
    }

    // Parse metadata if provided
    let metadata = null;
    if (input.metadata) {
      try {
        metadata = JSON.parse(input.metadata);
      } catch (e) {
        throw new BadRequestException('Invalid metadata JSON format');
      }
    }

    // Create specialty
    return (this.prisma as any).workerSpecialty.create({
      data: {
        workerId,
        categoryId: input.categoryId,
        experienceYears: input.experienceYears || 0,
        metadata,
        status: 'PENDING', // Default to PENDING for admin approval
      },
      include: {
        category: true,
      },
    });
  }

  async addMultipleSpecialties(workerId: string, specialties: CreateWorkerSpecialtyInput[]) {
    const results = [];
    
    for (const specialty of specialties) {
      try {
        const created = await this.addSpecialty(workerId, specialty);
        results.push({ success: true, specialty: created });
      } catch (error) {
        results.push({ 
          success: false, 
          categoryId: specialty.categoryId, 
          error: error.message 
        });
      }
    }
    
    return results;
  }

  async updateSpecialty(workerId: string, input: UpdateWorkerSpecialtyInput) {
    const specialty = await (this.prisma as any).workerSpecialty.findUnique({
      where: { id: input.id },
    });

    if (!specialty) {
      throw new NotFoundException('Specialty not found');
    }

    if (specialty.workerId !== workerId) {
      throw new BadRequestException('This specialty does not belong to you');
    }

    const updateData: any = {};
    if (input.experienceYears !== undefined) {
      updateData.experienceYears = input.experienceYears;
    }
    if (input.status !== undefined) {
      updateData.status = input.status;
    }
    if (input.metadata !== undefined) {
      try {
        updateData.metadata = JSON.parse(input.metadata);
      } catch (e) {
        throw new BadRequestException('Invalid metadata JSON format');
      }
    }

    return (this.prisma as any).workerSpecialty.update({
      where: { id: input.id },
      data: updateData,
      include: {
        category: true,
      },
    });
  }

  async removeSpecialty(workerId: string, specialtyId: string) {
    const specialty = await (this.prisma as any).workerSpecialty.findUnique({
      where: { id: specialtyId },
    });

    if (!specialty) {
      throw new NotFoundException('Specialty not found');
    }

    if (specialty.workerId !== workerId) {
      throw new BadRequestException('This specialty does not belong to you');
    }

    await (this.prisma as any).workerSpecialty.delete({
      where: { id: specialtyId },
    });

    return { success: true, message: 'Specialty removed successfully' };
  }

  async getWorkerSpecialties(workerId: string, includeInactive = false) {
    const where: any = { workerId };
    
    if (!includeInactive) {
      where.status = { in: ['PENDING', 'ACTIVE'] };
    }

    return (this.prisma as any).workerSpecialty.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getWorkerSpecialtyById(workerId: string, specialtyId: string) {
    const specialty = await (this.prisma as any).workerSpecialty.findUnique({
      where: { id: specialtyId },
      include: {
        category: true,
      },
    });

    if (!specialty) {
      throw new NotFoundException('Specialty not found');
    }

    if (specialty.workerId !== workerId) {
      throw new BadRequestException('This specialty does not belong to you');
    }

    return specialty;
  }

  /**
   * Get worker services (simplified view of specialties for frontend)
   * Maps WorkerSpecialty + ServiceCategory to Service type
   */
  async getMyServices(workerId: string) {
    const specialties = await (this.prisma as any).workerSpecialty.findMany({
      where: { 
        workerId,
        status: { in: ['PENDING', 'ACTIVE'] }
      },
      include: {
        category: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Map to Service type
    return specialties.map((specialty: any) => ({
      id: specialty.id,
      name: specialty.category.name,
      slug: specialty.category.slug,
      description: specialty.category.description,
      iconName: specialty.category.iconName,
      isActive: specialty.status === 'ACTIVE',
      experienceYears: specialty.experienceYears,
      createdAt: specialty.createdAt,
      updatedAt: specialty.updatedAt,
    }));
  }

  /**
   * Sync professional services - adds new services and removes unselected ones
   * This is the main method for managing the worker's service catalog
   */
  async syncProfessionalServices(workerId: string, services: ServiceSelectionInput[]) {
    // Validate worker exists
    const worker = await this.prisma.workerProfile.findUnique({
      where: { id: workerId },
    });

    if (!worker) {
      throw new NotFoundException('Worker profile not found');
    }

    // Get current specialties
    // Note: Using 'as any' for Prisma models that aren't in the base type
    const currentSpecialties = await (this.prisma as any).workerSpecialty.findMany({
      where: { workerId },
    });

    // Extract category IDs from input
    const newCategoryIds = services.map(s => s.categoryId);
    const currentCategoryIds = currentSpecialties.map((s: any) => s.categoryId);

    // Find categories to add (in new but not in current)
    const categoriesToAdd = services.filter(s => !currentCategoryIds.includes(s.categoryId));

    // Find categories to remove (in current but not in new)
    const categoriesToRemove = currentSpecialties.filter((s: any) => !newCategoryIds.includes(s.categoryId));

    // Find categories to update (in both)
    const categoriesToUpdate = services.filter(s => currentCategoryIds.includes(s.categoryId));

    // Perform operations in a transaction for atomicity
    await this.prisma.$transaction(async (tx) => {
      // Add new specialties
      for (const service of categoriesToAdd) {
        // Validate category exists
        const category = await (tx as any).serviceCategory.findUnique({
          where: { id: service.categoryId },
        });

        if (!category) {
          throw new BadRequestException(`Service category ${service.categoryId} not found`);
        }

        // Prepare metadata
        let metadata = null;
        if (service.description) {
          metadata = { description: service.description };
        }

        await (tx as any).workerSpecialty.create({
          data: {
            workerId,
            categoryId: service.categoryId,
            experienceYears: service.experienceYears || 0,
            metadata,
            status: 'PENDING', // Default to PENDING for admin approval
          },
        });
      }

      // Update existing specialties
      for (const service of categoriesToUpdate) {
        const existing = currentSpecialties.find((s: any) => s.categoryId === service.categoryId);
        
        if (existing) {
          const updateData: any = {
            experienceYears: service.experienceYears || 0,
          };

          if (service.description) {
            updateData.metadata = { description: service.description };
          }

          await (tx as any).workerSpecialty.update({
            where: { id: existing.id },
            data: updateData,
          });
        }
      }

      // Remove unselected specialties
      for (const specialty of categoriesToRemove) {
        await (tx as any).workerSpecialty.delete({
          where: { id: specialty.id },
        });
      }
    });

    // Return updated list of services
    return this.getMyServices(workerId);
  }
}

