import { Column, Entity, ManyToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Book } from '../../books/entities/book.entity';

@Entity('categories')
export class Category extends BaseEntity {
    @Column({ unique: true })
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string | null;

    @ManyToMany(() => Book, (book) => book.categories)
    books: Book[];
}
