import { PrismaClient, ServiceSubcategory, DifficultyLevel } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // ===== SEED DIFFICULTY MULTIPLIERS =====
  console.log('📊 Seeding difficulty multipliers...');
  const difficultyMultipliers = [
    { level: DifficultyLevel.EASY, value: 1.0 },
    { level: DifficultyLevel.MEDIUM, value: 1.2 },
    { level: DifficultyLevel.HARD, value: 1.5 },
    { level: DifficultyLevel.EXPERT, value: 2.0 },
  ];

  for (const mult of difficultyMultipliers) {
    const result = await prisma.difficultyMultiplier.upsert({
      where: { level: mult.level },
      update: { value: mult.value },
      create: mult,
    });
    console.log(`✅ Difficulty: ${result.level} = ${result.value}x`);
  }

  // ===== SEED EXTRAS MULTIPLIERS =====
  console.log('📊 Seeding extras multipliers...');
  const extrasMultipliers = [
    { code: 'URGENT', name: 'Urgente', value: 1.5, active: true },
    { code: 'HEIGHT', name: 'Trabajo en Altura', value: 1.2, active: true },
    { code: 'DIFFICULT_ACCESS', name: 'Acceso Difícil', value: 1.3, active: true },
    { code: 'WEEKEND', name: 'Fin de Semana', value: 1.4, active: true },
    { code: 'NIGHT', name: 'Horario Nocturno', value: 1.5, active: true },
  ];

  for (const extra of extrasMultipliers) {
    const result = await prisma.extrasMultiplier.upsert({
      where: { code: extra.code },
      update: { name: extra.name, value: extra.value, active: extra.active },
      create: extra,
    });
    console.log(`✅ Extra: ${result.name} (${result.code}) = ${result.value}x`);
  }

  // ===== SEED SERVICE CATEGORIES =====
  console.log('📦 Seeding service categories...');
  const categories = [
    {
      slug: 'mantenimiento',
      name: 'Mantenimiento',
      iconName: 'TreePine',
      description: 'Servicios de mantenimiento general',
      basePrice: 5000,
      hourlyRate: 3500,
      estimatedHours: 1.5,
      active: true,
    },
    {
      slug: 'pintura',
      name: 'Pintura',
      iconName: 'Paintbrush',
      description: 'Servicios de pintura interior y exterior',
      basePrice: 6000,
      hourlyRate: 3500,
      estimatedHours: 3.0,
      active: true,
    },
    {
      slug: 'climatizacion',
      name: 'Climatización',
      iconName: 'Wind',
      description: 'Instalación y reparación de sistemas de climatización',
      basePrice: 8000,
      hourlyRate: 4000,
      estimatedHours: 4.0,
      active: true,
    },
    {
      slug: 'electricidad',
      name: 'Electricidad',
      iconName: 'Zap',
      description: 'Instalaciones y reparaciones eléctricas',
      basePrice: 4000,
      hourlyRate: 3500,
      estimatedHours: 1.0,
      active: true,
    },
    {
      slug: 'plomeria',
      name: 'Plomería',
      iconName: 'Droplets',
      description: 'Instalaciones y reparaciones de plomería',
      basePrice: 4500,
      hourlyRate: 3500,
      estimatedHours: 1.0,
      active: true,
    },
  ];

  const categoryMap: Record<string, string> = {};
  
  for (const category of categories) {
    const result = await prisma.serviceCategory.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    });
    categoryMap[category.slug] = result.id;
    console.log(`✅ Category: ${result.name} (${result.slug})`);
  }

  // ===== SEED SERVICE FORMULAS =====
  console.log('📐 Seeding service formulas...');
  const formulas = [
    // MAINTENANCE
    {
      subcategory: ServiceSubcategory.LAWN_MOWING,
      serviceCategoryId: categoryMap['mantenimiento'],
      baseTimeFormula: '(m.squareMeters || 50) / 50',
      defaultMetadata: { squareMeters: 50 },
      active: true,
    },
    {
      subcategory: ServiceSubcategory.GARDEN_CLEANUP,
      serviceCategoryId: categoryMap['mantenimiento'],
      baseTimeFormula: '(m.squareMeters || 50) / 30',
      defaultMetadata: { squareMeters: 50 },
      active: true,
    },
    {
      subcategory: ServiceSubcategory.TREE_TRIMMING,
      serviceCategoryId: categoryMap['mantenimiento'],
      baseTimeFormula: '(m.trees || 1) * 2',
      defaultMetadata: { trees: 1 },
      active: true,
    },
    {
      subcategory: ServiceSubcategory.PRESSURE_WASHING,
      serviceCategoryId: categoryMap['mantenimiento'],
      baseTimeFormula: '(m.squareMeters || 50) / 40',
      defaultMetadata: { squareMeters: 50 },
      active: true,
    },
    // PAINTING
    {
      subcategory: ServiceSubcategory.INTERIOR_PAINTING,
      serviceCategoryId: categoryMap['pintura'],
      baseTimeFormula: '((m.squareMeters || 10) / 10) * (m.coats || 1) * 2',
      defaultMetadata: { squareMeters: 10, coats: 1 },
      active: true,
    },
    {
      subcategory: ServiceSubcategory.EXTERIOR_PAINTING,
      serviceCategoryId: categoryMap['pintura'],
      baseTimeFormula: '((m.squareMeters || 10) / 10) * (m.coats || 1) * 2.5',
      defaultMetadata: { squareMeters: 10, coats: 1 },
      active: true,
    },
    {
      subcategory: ServiceSubcategory.WALL_REPAIR,
      serviceCategoryId: categoryMap['pintura'],
      baseTimeFormula: '(m.squareMeters || 5) / 5 * 1.5',
      defaultMetadata: { squareMeters: 5 },
      active: true,
    },
    // HVAC
    {
      subcategory: ServiceSubcategory.AC_INSTALLATION,
      serviceCategoryId: categoryMap['climatizacion'],
      baseTimeFormula: '(m.type === "SPLIT" ? 4 : 3) * (m.units || 1)',
      defaultMetadata: { type: 'WINDOW', units: 1 },
      active: true,
    },
    {
      subcategory: ServiceSubcategory.AC_REPAIR,
      serviceCategoryId: categoryMap['climatizacion'],
      baseTimeFormula: '2',
      defaultMetadata: {},
      active: true,
    },
    {
      subcategory: ServiceSubcategory.AC_MAINTENANCE,
      serviceCategoryId: categoryMap['climatizacion'],
      baseTimeFormula: '1.5 * (m.units || 1)',
      defaultMetadata: { units: 1 },
      active: true,
    },
    {
      subcategory: ServiceSubcategory.HEATING_INSTALLATION,
      serviceCategoryId: categoryMap['climatizacion'],
      baseTimeFormula: '5',
      defaultMetadata: {},
      active: true,
    },
    // ELECTRICAL
    {
      subcategory: ServiceSubcategory.OUTLET_INSTALLATION,
      serviceCategoryId: categoryMap['electricidad'],
      baseTimeFormula: '0.5 * (m.units || 1)',
      defaultMetadata: { units: 1 },
      active: true,
    },
    {
      subcategory: ServiceSubcategory.LIGHTING_INSTALLATION,
      serviceCategoryId: categoryMap['electricidad'],
      baseTimeFormula: '1 * (m.units || 1)',
      defaultMetadata: { units: 1 },
      active: true,
    },
    {
      subcategory: ServiceSubcategory.CIRCUIT_BREAKER,
      serviceCategoryId: categoryMap['electricidad'],
      baseTimeFormula: '2',
      defaultMetadata: {},
      active: true,
    },
    {
      subcategory: ServiceSubcategory.WIRING_REPAIR,
      serviceCategoryId: categoryMap['electricidad'],
      baseTimeFormula: '(m.meters || 10) / 10',
      defaultMetadata: { meters: 10 },
      active: true,
    },
    // PLUMBING
    {
      subcategory: ServiceSubcategory.LEAK_REPAIR,
      serviceCategoryId: categoryMap['plomeria'],
      baseTimeFormula: '1.5',
      defaultMetadata: {},
      active: true,
    },
    {
      subcategory: ServiceSubcategory.PIPE_INSTALLATION,
      serviceCategoryId: categoryMap['plomeria'],
      baseTimeFormula: '(m.meters || 5) / 5 * 2',
      defaultMetadata: { meters: 5 },
      active: true,
    },
    {
      subcategory: ServiceSubcategory.DRAIN_CLEANING,
      serviceCategoryId: categoryMap['plomeria'],
      baseTimeFormula: '1',
      defaultMetadata: {},
      active: true,
    },
    {
      subcategory: ServiceSubcategory.FAUCET_INSTALLATION,
      serviceCategoryId: categoryMap['plomeria'],
      baseTimeFormula: '0.75 * (m.units || 1)',
      defaultMetadata: { units: 1 },
      active: true,
    },
  ];

  for (const formula of formulas) {
    const result = await prisma.serviceFormula.upsert({
      where: { subcategory: formula.subcategory },
      update: {
        serviceCategoryId: formula.serviceCategoryId,
        baseTimeFormula: formula.baseTimeFormula,
        defaultMetadata: formula.defaultMetadata,
        active: formula.active,
      },
      create: formula,
    });
    console.log(`✅ Formula: ${result.subcategory}`);
  }

  // ===== SEED SYSTEM CONFIG =====
  console.log('⚙️  Seeding system configuration...');
  const systemConfigs = [
    {
      key: 'cancelation_window_hours',
      value: '24',
      type: 'INT',
      description: 'Hours before scheduled time for free cancellation',
    },
    {
      key: 'penalty_fee_percentage',
      value: '0.30',
      type: 'FLOAT',
      description: 'Penalty fee percentage for late cancellations (30%)',
    },
    {
      key: 'commission_percentage',
      value: '0.25',
      type: 'FLOAT',
      description: 'Platform commission percentage (25%)',
    },
    {
      key: 'worker_timeout_minutes',
      value: '15',
      type: 'INT',
      description: 'Minutes for worker to accept an offer',
    },
    {
      key: 'auto_release_hours',
      value: '72',
      type: 'INT',
      description: 'Hours after completion to auto-release payout',
    },
    {
      key: 'max_assignment_attempts',
      value: '3',
      type: 'INT',
      description: 'Maximum worker assignment attempts before expiring request',
    },
  ];

  for (const config of systemConfigs) {
    const result = await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: config,
      create: config,
    });
    console.log(`✅ Config: ${result.key} = ${result.value}`);
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
