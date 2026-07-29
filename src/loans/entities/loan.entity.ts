import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Book } from '../../books/entities/book.entity';
import { User } from '../../users/entities/user.entity';

@Entity('loans')
export class Loan extends BaseEntity {
    @ManyToOne(() => Book, (book) => book.loans, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'bookId' })
    book: Book;

    @Column()
    bookId: string;

    @ManyToOne(() => User, (user) => user.loans, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    userId: string;

    @Column({ type: 'date' })
    dueDate: string;

    @Column({ type: 'timestamp', nullable: true })
    returnedAt: Date | null;
}
