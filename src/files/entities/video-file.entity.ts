import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Album } from './album.entity';

@Entity('videos')
export class VideoFile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  file_name: string;

  @Column()
  original_url: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  individual_price: number;

  @Column()
  album_id: string;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'tinyint', default: true })
  status: boolean;

  @ManyToOne(() => Album, (album) => album.videos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'album_id' })
  album: Album;
}
