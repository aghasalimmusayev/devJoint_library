import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Book } from '../../books/entities/book.entity';

@Entity('authors')
export class Author extends BaseEntity {
    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @Column({ type: 'text', nullable: true })
    bio: string | null;

    @Column({ type: 'date', nullable: true })
    birthDate: string | null;

    @OneToMany(() => Book, (book) => book.author)
    books: Book[];
}
