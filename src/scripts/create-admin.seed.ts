import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../app.module';
import { User } from '../users/entities/user.entity';
import { Role } from '../common/enums/role.enum';
import { Gender } from '../common/enums/gender.enum';

async function run() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const userRepository = app.get<Repository<User>>(getRepositoryToken(User));

    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    if (!email || !password) {
        console.error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env');
        await app.close();
        process.exit(1);
    }

    const existing = await userRepository.findOne({ where: { email } });
    if (existing) {
        console.log(`Admin with email ${email} already exists, skipping.`);
        await app.close();
        return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = userRepository.create({
        name: 'Admin',
        surname: 'Admin',
        gender: Gender.MALE,
        email,
        password: hashedPassword,
        role: Role.ADMIN,
    });
    await userRepository.save(admin);

    console.log(`Admin created: ${email}`);
    await app.close();
}

run();
