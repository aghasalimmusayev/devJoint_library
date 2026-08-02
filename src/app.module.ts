import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { addTransactionalDataSource } from 'typeorm-transactional';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import typeormConfig from './config/typeorm.config';
import jwtConfig from './config/jwt.config';
import { AuthorsModule } from './authors/authors.module';
import { BooksModule } from './books/books.module';
import { CategoriesModule } from './categories/categories.module';
import { LoansModule } from './loans/loans.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true, load: [typeormConfig, jwtConfig] }),
        TypeOrmModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) =>
                configService.get<TypeOrmModuleOptions>('database')!,
            // Registers the DataSource with typeorm-transactional so @Transactional()
            // knows which connection to run its transactions on.
            dataSourceFactory: async (options) => {
                if (!options) throw new Error('TypeORM options are missing');
                return addTransactionalDataSource(new DataSource(options));
            },
        }),
        AuthorsModule,
        BooksModule,
        CategoriesModule,
        LoansModule,
        UsersModule,
        AuthModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
