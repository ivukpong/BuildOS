import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    constructor() {
        const base = process.env.DATABASE_URL ?? '';
        // Append pool settings if not already present to avoid exhausting
        // Railway's connection limit (default Prisma pool = num_cpus*2+1 ≈ 21).
        const url = base.includes('connection_limit')
            ? base
            : `${base}${base.includes('?') ? '&' : '?'}connection_limit=5&pool_timeout=30`;
        super({ datasources: { db: { url } } });
    }

    async onModuleInit() {
        await this.$connect();
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }
}
