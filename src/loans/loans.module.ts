import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Loan } from './entities/loan.entity';
import { Book } from '../books/entities/book.entity';
import { User } from '../users/entities/user.entity';
import { LoansService } from './loans.service';
import { LoansController } from './loans.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Loan, Book, User])],
    controllers: [LoansController],
    providers: [LoansService],
})
export class LoansModule {}
