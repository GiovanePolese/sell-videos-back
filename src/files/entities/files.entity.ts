import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('images')
export class Files {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  fk_users: number;

  @Column()
  image_name: string;

  @Column()
  image_url: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  date: Date;

  @Column({ type: 'tinyint', default: true })
  status: boolean;
}
