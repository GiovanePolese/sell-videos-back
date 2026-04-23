import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  txid: string;

  @Column({ type: 'varchar', length: 32, default: 'PENDENTE' })
  status: string;

  @Column({ type: 'varchar', length: 11, nullable: true })
  payer_document?: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  payer_name?: string;

  @Column({ type: 'varchar', length: 16 })
  amount: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  @Column({ type: 'mediumtext' })
  qrcodeImage: string;

  @Column({ type: 'varchar', length: 512 })
  copyAndPaste: string;
}
