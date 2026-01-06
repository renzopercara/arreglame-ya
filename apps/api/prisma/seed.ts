import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Seed ServiceCategory table
  const categories = [
    {
      slug: 'corte-pasto',
      name: 'Corte de Pasto',
      iconName: 'TreePine',
      description: 'Servicio profesional de corte y mantenimiento de césped',
      basePrice: 5000,
      hourlyRate: 0,
      estimatedHours: 1.5,
      active: true,
    },
    {
      slug: 'electricidad-menor',
      name: 'Electricidad Menor',
      iconName: 'Zap',
      description: 'Reparaciones e instalaciones eléctricas menores',
      basePrice: 4000,
      hourlyRate: 0,
      estimatedHours: 1.0,
      active: true,
    },
    {
      slug: 'plomeria-express',
      name: 'Plomería Express',
      iconName: 'Droplets',
      description: 'Soluciones rápidas para problemas de plomería',
      basePrice: 4500,
      hourlyRate: 0,
      estimatedHours: 1.0,
      active: true,
    },
    {
      slug: 'pintura-retoque',
      name: 'Pintura Retoque',
      iconName: 'Paintbrush',
      description: 'Retoques y trabajos de pintura para tu hogar',
      basePrice: 6000,
      hourlyRate: 0,
      estimatedHours: 3.0,
      active: true,
    },
  ];

  console.log('📦 Seeding service categories...');
  
  for (const category of categories) {
    const result = await prisma.serviceCategory.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    });
    console.log(`✅ Category: ${result.name} (${result.slug})`);
  }

  console.log('✨ Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
