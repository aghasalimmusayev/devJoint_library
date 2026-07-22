import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Loan } from './entities/loan.entity';
import { Book } from '../books/entities/book.entity';
import { Member } from '../members/entities/member.entity';
import { LoansService } from './loans.service';
import { LoansController } from './loans.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Loan, Book, Member])],
    controllers: [LoansController],
    providers: [LoansService],
})
export class LoansModule {}
