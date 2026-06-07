import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DepartmentsService {
    constructor(private prisma: PrismaService) { }

    findAll() {
        return this.prisma.department.findMany({
            include: {
                head: true,
                employees: true,
            },
            orderBy: { name: 'asc' },
        });
    }

    findOne(id: string) {
        return this.prisma.department.findUniqueOrThrow({
            where: { id },
            include: { head: true, employees: true },
        });
    }

    async create(data: any) {
        const name = String(data?.name ?? '').trim();
        if (!name) {
            throw new BadRequestException('Department name is required');
        }

        const existing = await this.prisma.department.findFirst({
            where: {
                name: {
                    equals: name,
                    mode: 'insensitive',
                },
            },
        });
        if (existing) {
            throw new ConflictException(`Department '${name}' already exists`);
        }

        const payload = {
            name,
            description: String(data?.description ?? '').trim() || `${name} department`,
            location: String(data?.location ?? '').trim() || 'Head Office',
            budget: Number(data?.budget ?? 0) || 0,
            headId: data?.headId ?? null,
        };

        return this.prisma.department.create({ data: payload });
    }

    async update(id: string, data: any) {
        const payload: Record<string, any> = {};

        if (typeof data?.name === 'string') {
            const nextName = data.name.trim();
            if (!nextName) {
                throw new BadRequestException('Department name is required');
            }

            const duplicate = await this.prisma.department.findFirst({
                where: {
                    id: { not: id },
                    name: {
                        equals: nextName,
                        mode: 'insensitive',
                    },
                },
            });
            if (duplicate) {
                throw new ConflictException(`Department '${nextName}' already exists`);
            }
            payload.name = nextName;
        }

        if (typeof data?.description === 'string') {
            payload.description = data.description.trim();
        }
        if (typeof data?.location === 'string') {
            payload.location = data.location.trim();
        }
        if (data?.budget !== undefined) {
            payload.budget = Number(data.budget) || 0;
        }
        if (data?.headId !== undefined) {
            payload.headId = data.headId || null;
        }

        return this.prisma.department.update({ where: { id }, data: payload });
    }

    remove(id: string) {
        return this.prisma.department.delete({ where: { id } });
    }
}
