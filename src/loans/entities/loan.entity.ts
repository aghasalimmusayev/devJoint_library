import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Book } from '../../books/entities/book.entity';
import { Member } from '../../members/entities/member.entity';

@Entity('loans')
export class Loan extends BaseEntity {
    @ManyToOne(() => Book, (book) => book.loans, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'bookId' })
    book: Book;

    @Column()
    bookId: string;

    @ManyToOne(() => Member, (member) => member.loans, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'memberId' })
    member: Member;

    @Column()
    memberId: string;

    @Column({ type: 'date' })
    dueDate: string;

    @Column({ type: 'timestamp', nullable: true })
    returnedAt: Date | null;
}
