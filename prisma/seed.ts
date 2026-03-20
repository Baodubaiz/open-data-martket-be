import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seedCategories() {
    const categories = [
        { name: 'AI', description: 'Artificial Intelligence datasets' },
        { name: 'Computer Vision', description: 'Image & video datasets' },
        { name: 'NLP', description: 'Text & language datasets' },
        { name: 'Finance', description: 'Financial datasets' },
        { name: 'Healthcare', description: 'Medical datasets' },
        { name: 'Education', description: 'Educational datasets' },

        // ⭐ thêm mấy cái thực tế hơn
        { name: 'E-commerce', description: 'Shopping & customer behavior data' },
        { name: 'Social Media', description: 'User interaction datasets' },
        { name: 'IoT', description: 'Sensor & device data' },
        { name: 'Geospatial', description: 'Location & map datasets' },
    ];

    for (const category of categories) {
        await prisma.category.upsert({
            where: { name: category.name },
            update: {},
            create: category,
        });
    }

    console.log('✅ Categories seeded');
}

async function seedAdmin() {
    const hashedPassword = await bcrypt.hash('123456', 10);

    const admin = await prisma.user.upsert({
        where: { email: 'admin1@gmail.com' },
        update: {},
        create: {
            email: 'admin@gmail.com',
            password: hashedPassword,
            full_name: 'System Admin',
            role: Role.admin,
            is_active: true,
        },
    });

    console.log('✅ Admin user seeded');

    return admin;
}

async function seedAdminWallet(adminId: string) {
    const existingWallet = await prisma.wallet.findUnique({
        where: { user_id: adminId },
    });

    if (!existingWallet) {
        await prisma.wallet.create({
            data: {
                user_id: adminId,
                balance: 0,
                pending_balance: 0,
            },
        });

        console.log('✅ Admin wallet created');
    }
}

async function seedSystemConfigLikeData() {
    // ⚠️ Vì bạn chưa có bảng config → mình tận dụng category để giả lập "system default"
    // Nếu sau này có bảng SystemConfig thì chuyển qua đó

    // Ví dụ: đảm bảo luôn có ít nhất 1 category fallback
    await prisma.category.upsert({
        where: { name: 'Other' },
        update: {},
        create: {
            name: 'Other',
            description: 'Fallback category',
        },
    });

    console.log('✅ System fallback data seeded');
}

async function main() {
    console.log('🌱 START SEEDING SYSTEM DATA...');

    await seedCategories();

    const admin = await seedAdmin();

    await seedAdminWallet(admin.user_id);

    await seedSystemConfigLikeData();

    console.log('🎉 ALL SYSTEM DATA SEEDED!');
}

main()
    .catch((e) => {
        console.error('❌ Seed error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });